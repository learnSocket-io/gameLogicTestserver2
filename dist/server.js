'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const socket_io_1 = require('socket.io');
require('dotenv/config');
const room_1 = __importDefault(require('./room'));
const user_1 = __importDefault(require('./user'));
const mock_db_1 = __importDefault(require('./mock-db'));
const serverOption = {
  path: '/game/',
  cors: {
    origin: 'http://localhost:3000',
    method: ['GET', 'POST'],
  },
};
const io = new socket_io_1.Server(serverOption);
const testRoom = new room_1.default(1);
mock_db_1.default.rooms[testRoom.roomId] = testRoom;
io.on('connection', (socket) => {
  const socketData = {};
  socket.on('identify-myself', ({ userID }) => {
    socketData.userId = userID;
  });
  socket.onAny((event, ...args) => {
    console.log(`들어온 이벤트: ${event}`);
    console.log(`  ${args}`);
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`나가는 이벤트: ${event}`);
    console.log(`  ${args}`);
  });
  socket.on('join-room', async ({ roomId }, callback) => {
    if (!socketData.userId) return callback();
    if (socket.rooms.size > 1) return callback();
    const room = mock_db_1.default.rooms[roomId];
    if (!room) return callback();
    if (room.users.length >= 4) return callback();
    if (room.findUser(socketData.userId)) return callback();
    await socket.join(roomId.toString());
    socketData.currentRoom = room;
    room.users.push(new user_1.default(socketData.userId));
  });
  socket.on('ready', (callback) => {
    if (!socketData.userId) return callback();
    const room = socketData.currentRoom;
    if (!room) return callback();
    const user = room.findUser(socketData.userId);
    if (!user) return callback();
    user.prepare();
    if (room.isReady()) {
      room.initial();
      io.to(room.roomId.toString()).emit('game-starts', { order: room.order });
    }
  });
});
io.listen(Number(process.env.PORT));
