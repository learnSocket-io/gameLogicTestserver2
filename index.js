const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("redis");

dotenv.config();
app.use(cors());

//redis 기본 정리 및 연결 시작
const client = createClient({
  url: process.env.REDIS_HOST,
});
const connectClient = async () => {
  return await client.connect();
};

//redis 쓰기.
connectClient()
  .then(async () => {
    await client.set("qwerqwerqwer", "연결완료");
    const value = await client.get("qwerqwerqwer");
    console.log(value);
  })
  .catch((err) => {
    console.log(err.message);
  });

//쓰기.
client.set("qwer", "qwerqwerqwerqwer");

//hoho 에 "field", "value" 를 넣는다.
// client.hSet("hoho", "field", "value");
// client.hgetall('friends')

//한개씩 추가해야할 때 + 중복 제거도 해줌.
// client.sadd('fruits', 'apple', 'orange', 'pear', 'banana', 'apple')
//client.sadd('fruits', 'lulu')
// client.smembers('fruits')

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST"],
  },
});

const users = {};
const socketToRoom = {};

// io.on("connection", (socket) => {

// });

io.on("connection", (socket) => {
  socket["nickName"] = "익명";
  socket.onAny(async (e) => {
    console.log(`SocketEvent:${e}`);
    await client.set("yes31", "test redis from yes");
  });
  console.log(socket.id);

  socket.on("send_message", (data, addMyMessage) => {
    console.log(data);
    socket.to(data.room).emit("receive_message", data.msg);
    addMyMessage(data.msg);
  });

  socket.on("join_room", (data, userId) => {
    socket.join(data);
    socket.to(data).emit("welcome", socket.nickname);
  });

  socket.on("nickName", (nickName) => {
    socket["nickName"] = nickName;
  });

  socket.on("whisper", (nickName, msg, addMyMessage) => {
    const targetSoc = [...io.sockets.sockets];
    const target = targetSoc.filter((el) => el[1].nickName === nickName);
    if (target[0][0]) socket.to(target[0][0]).emit("receive_message", msg);
    addMyMessage(msg);
  });

  // 화상채팅
  socket.on("joinRtcRoom", (roomID, userId) => {
    console.log(roomID);

    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 4) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });
  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
  });

  ///testcode
  socket.on("redisTest", (key, value) => {
    console.log("key 값: ", key);
    console.log("value 값: ", value);
    client.sAdd(key, value);
  });

  //게임으로 들어가는 부분
  socket.on("gameStart", (roomId, userId) => {
    console.log("roomId console", roomId);
    console.log("userId console", userId);
    console.log("socket console", socket.id);
    //요청하는 사람의 Id 잡기. 화상 소켓 채팅
    //roomId에 해당하는 유저들의 정보를 찾아서 되돌려준다.
    //게임방에 들어왔을 때
  });
});

//http 연결시 3000으로 진행하기 때문에 다른 port 값을 지정한것?
server.listen(3001, () => {
  console.log("Server is Listening");
});
