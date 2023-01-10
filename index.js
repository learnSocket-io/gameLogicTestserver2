const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

//Set data to Redis

//client.setEx("key_sols", 3600, "test-input");

//console.log("aasdfasdfasdfasdfasdf", client);

app.use(cors());

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
  socket.onAny((e) => {
    console.log(`SocketEvent:${e}`);
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
});

//http 연결시 3000으로 진행하기 때문에 다른 port 값을 지정한것?
server.listen(3001, () => {
  console.log("Server is Listening");
});
