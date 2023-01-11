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

//FIXME: redis 쓰기.
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

//test data
const data = {
  roomId: 3,
  users: [
    {
      nickname: "~~",
      chatSids: "일반채팅",
      videoSids: "화상채팅",
      card: [[], []],
      black: 1,
    },
    {
      nickname: "~~",
      chatSids: "일반채팅",
      videoSids: "화상채팅",
      card: [[], []],
      black: 2,
    },
    {
      nickname: "~~",
      chatSids: "일반채팅",
      videoSids: "화상채팅",
      card: [[], []],
      black: 3,
    },
    {
      nickname: "~~",
      chatSids: "일반채팅",
      videoSids: "화상채팅",
      card: [[], []],
      black: 2,
    },
  ],
};

//NOTE: 변수 설정 부분
let whiteCard = 0;
let blackCardList = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];
let whiteCardList = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];
let thisRoom = "";
let roomState = 0;
let gamingUser = [];

//NOTE:
//console.log(socket.id); sids정보

//NOTE: SOCKET IO 시작 부분
io.on("connection", (socket) => {
  socket["nickName"] = "익명";
  socket.onAny(async (e) => {
    console.log(`SocketEvent:${e}`);
    await client.set("yes31", "test redis from yes");
  });

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

  //NOTE: 화상채팅
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

  //NOTE: 게임으로 들어가는 부분
  socket.on("gameStart", (roomId, userId) => {
    console.log("roomId console", roomId);
    console.log("userId console", userId);
    console.log("socket console", socket.id);
    //요청하는 사람의 Id 잡기. 화상 소켓 채팅
    socket["userId"] = socket.id;
    // 화상 sids, 채팅 sids 추가
    // io에서 room 해당하는 user의 정보를 가져오기.

    //roomId에 해당하는 유저들의 정보를 찾아서 되돌려준다.
    // {nickname: "~~", chatSids: "일반채팅", videoSids:"화상채팅", card:[[],[]], black: 1  }
  });

  //NOTE: 게임 로직 구현
  //첫 패를 선택하는 부분
  socket.on("selectFirstCard", (userId, black, addMyCard) => {
    console.log("입력 받은 userId", userId); // userId
    console.log("입력 받은 black수", black); // black card의 수

    //흰색 카드의 수 설정.

    const whiteCard = 3 - black.black;

    let count = 0;
    let arr1 = [];
    for (let i = 0; count < black.black; i++) {
      const number = Math.floor(Math.random() * 12); //시작할때는 조커가 없어야한다.
      if (blackCardList[number] === null) {
        blackCardList[number] = userId;
        arr1 = [...arr1, { color: "black", value: number }];
        count++;
      }
    }

    count = 0;
    for (let i = 0; count < whiteCard; i++) {
      number = Math.floor(Math.random() * 12);

      if (whiteCardList[number] === null) {
        whiteCardList[number] = userId;
        arr1 = [...arr1, { color: "white", value: number }];
        count++;
      }
    }

    socket["card"] = arr1;

    console.log(
      socket.card
        .sort((a, b) => a.value - b.value)
        .sort((a, b) => {
          if (a.value === b.value) {
            if (a.color < b.color) return -1;
            else if (b.color < a.color) return 1;
            else return 0;
          }
        })
    );
    //유저들의 전체 카드에 대한 정보를 쏴줘야한다.
    const userIdAndCard = { userId: userId.userId, card: [socket.card] };
    gamingUser = [...gamingUser, userIdAndCard];
    console.log("게임유저 저장되는것 확인:", gamingUser);

    //test를 위한 값 살려놓기
    addMyCard(socket.car)
    //FIXME: to.("roomId")가 빠져있음.
    if (gamingUser.length === 4) {
      socket.emit("allUsersFirstCard", gamingUser);
    }

    //userId가 있는 roomId 에도 뿌려줘야한다.
    //마지막 함수를 통해서 param을 던져줘야한다.
    // TODO: 한줄씩 가자.
    // TODO: endstate 말고 구현이 먼저
    // TODO: code가 이쁜건 나중에 리팩토링
  });

  //타일을 선택하는 기능. //받은 타일이 조커인지, 숫자인지에 대한 분기가 필요하다.
  socket.on("selectCard", (userId, black) => {
    if (black) {
      //black인 경우
      let count = 0;
      let arr1 = [];
      for (let i = 0; count < 1; i++) {
        //FIXME: 가지고 있는 값 내에서 랜덤을 가져오도록 구현하면 서버에 부담이 줄것이라 생각
        const number = Math.floor(Math.random() * 13); 
        if (blackCardList[number] === null) {
          blackCardList[number] = userId;
          
          count++;
        }
      }
    } else {
      //white인 경우
    }
  });

  //상대를 지목하는 기능
  //지목한 상대의 카드들에 대한 정보를 보내줘야 한다.
  socket.on("selectUser", (userId, getCard) => {
    for (i = 0; i < gamingUser.length; i++) {
      if (gamingUser[i].userId == userId) {
        getCard(gamingUser[i]);
        break;
      }
    }
  });
});

//http 연결시 3000으로 진행하기 때문에 다른 port 값을 지정한것?
server.listen(3001, () => {
  console.log("Server is Listening");
});
