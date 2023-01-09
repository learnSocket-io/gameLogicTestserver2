//require은 임포트 업그레이드 버전?? import > require
//바벨에서 찍어보면 불안한 경우가 있다 import했을떄 뜨는 에러가 있다@@
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

//왜 http가 소켓을 하는데 코드안에 포함되어있을까
//stomp sub프로토콜

//첫 연결을 위해서 http신을 준비
const server = http.createServer(app);
// require로 불러온 class Server의 인스턴스를 만들어주고
const io = new Server(server, {
  //연결할때 사용할 cors..?
  cors: {
    origin: "http://sprta-yes.shop",
    method: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  //   console.log(socket.id);

  socket["nickName"] = "익명";
  // socket.onAny==> 이벤트가 발생할 때 실행될 리스너를 추가
  // 반대의 개념으로 socket.offAny( [리스너] ) :: 범용 리스너를 제거할 수 있음.
  socket.onAny((e) => {
    console.log(socket.eventNames());
    //console.log(socket);
    //socket.eventNames() 에 리스들에 대한 정의가 배열로 저장됨.
    //console.log(socket.eventNames());

    //이벤트 발생시 실행된 리스너의 정보 -> (e) 값을 출력.
    //어떤 리스너를 실행시켰는지 확인 가능하다.
    console.log(`SocketEvent:${e}`);
  });
  //소켓 io의 가장 큰 장점 c

  socket.on("send_message", (data, addMyMessage) => {
    // console.log(data);
    socket.to(data.room).emit("receive_message", data.msg);
    addMyMessage(data.msg);
  });

  socket.on("join_room", (data) => {
    socket.join(data);
    socket.to(data).emit("welcome", socket.nickname);
  });

  socket.on("nickName", (nickname) => {
    socket["nickName"] = nickname;
  });
});

server.listen(3001, () => {
  console.log("SErver is Listening");
});
