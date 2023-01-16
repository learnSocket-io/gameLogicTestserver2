import 'dotenv/config';
import Joi from 'joi';

import Server from './config/socket-io';
import UserData from './user-data';
import User from './user';
import ErrorPayload from './errorPayload';

import redis from './mock-db';

const userDataSchema = Joi.object<UserData>().keys({
  userId: Joi.number().required().description('유저 식별자'),
  username: Joi.string().required().description('유저 이름'),
});

const io = new Server();

io.on('connection', async (socket) => {
  // HACK: 게임 로직 완성 후 쿠키로 유저 ID 받아오게 바궈야 함
  const { error: joiError, value } = userDataSchema.validate(
    socket.handshake.query
  );
  if (joiError) {
    io.to(socket.id).emit('error', new ErrorPayload(0, joiError.message));
    socket.disconnect(true);
    return;
  }
  const me = new UserData({
    userId: value.userId,
    username: value.username,
  });

  // 들어온 사람한테는 방에 있는 사람들 목록
  // 기존에 있던 사람들한테는 새로 온 사람 정보

  // NOTE: 디버그용
  socket.onAny((event, ...args) => {
    console.log(`들어온 이벤트: ${event}`);
    console.log(`  ${args}`);
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`나가는 이벤트: ${event}`);
    console.log(`  ${args}`);
  });

  socket.on('join-room', async ({ roomId }: { roomId: number }) => {
    // TODO: 이미 다른 방에 있을 때
    if (socket.rooms.size > 1) return io.to(socket.id).emit('error');

    const room = redis.rooms[roomId];

    // TODO: 방 없을 때
    if (!room) return io.to(socket.id).emit('error');

    // TODO: 다 찼을 때
    if (room.users.length >= 4) return io.to(socket.id).emit('error');

    // TODO: 이미 접속 중인 사용자일 때
    if (room.findUser(me.userId)) return io.to(socket.id).emit('error');

    await socket.join(roomId.toString());

    me.currentRoom = room;
    room.users.push(new User(me.userId));
  });

  socket.on('ready', (callback) => {
    // TODO: 유저 ID가 없을 때
    if (!me.userId) return io.to(socket.id).emit('error');

    const room = me.currentRoom;

    // TODO: 소켓 정보에 방이 없을 때
    if (!room) return io.to(socket.id).emit('error');

    const user = room.findUser(me.userId);

    // TODO: 방에 유저 정보가 없을 때
    if (!user) return io.to(socket.id).emit('error');

    user.prepare();

    if (room.isReady()) {
      room.initial();

      io.to(room.roomId.toString()).emit('game-starts', { order: room.order });
    }
  });
});

io.listen(Number(process.env.PORT));
