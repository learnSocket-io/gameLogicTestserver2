// TODO: 한줄씩 가자.
// TODO: endstate 말고 구현이 먼저
// TODO: code가 이쁜건 나중에 리팩토링
//redis-cli -h redis-game-ro.rbvg10.ng.0001.apn2.cache.amazonaws.com
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("redis");
const { log } = require("console");

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
// client.sadd('fruits', 'lulu')
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

//test code

const data = [];
const data2 = {
  roomId: 3,
  users: [
    {
      userId: 1,
      gameSids: "일반채팅",
      videoSids: "화상채팅",
      card: [],
    },
    {
      userId: 3,
      gameSids: "일반채팅",
      videoSids: "화상채팅",
      card: [],
    },
    {
      userId: 19,
      gameSids: "일반채팅",
      videoSids: "화상채팅",
      card: [],
    },
    {
      userId: 33,
      gameSids: "일반채팅",
      videoSids: "화상채팅",
      card: [],
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

let countBlack = 0;
let countWhite = 0;
let gamingUser = [];

//NOTE:
//console.log(socket.id); sids정보

//NOTE: SOCKET IO 시작 부분
io.on("connection", (socket) => {
  socket["nickName"] = "익명";
  socket.onAny(async (e) => {
    console.log(`SocketEvent:${e}`);

    // await client.sAdd("fruits", "apple", "orange", "pear", "banana", "apple");
    // await client.sAdd("fruits", "lulu");

    //비동기 형식으로 접근해야만 함.
    // await client.set("testCode", "test msg");  ---- O
    // const testCode = await client.get("testCode");  ---- O
    // console.log("testcode 대한 값 표현", testCode);  ---- O
    // const qwer = await client.get("qwer");  ---- O
    // console.log("qwer에 대한 값 표현", qwer);  ---- O
  });

  socket.on("send_message", (data, addMyMessage) => {
    console.log(data);
    socket.to(data.room).emit("receive_message", data.msg);
    addMyMessage(data.msg);
  });

  socket.on("join_room", ({ roomId, userId }) => {
    socket["userId"] = userId;
    socket.join(roomId);
    //const sample = { userId, gameSids: socket.id };
    const sample = {
      roomId,
      blackCardList: [
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
      ],
      whiteCardList: [
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
      ],
      roomData: [{ userId, gameSids: socket.id }],
    };
    console.log("입력받은 값 출력",sample.roomData)
    data.push(sample);
    

    socket.to(roomId).emit("welcome", socket.nickname);
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
    //socket.id 랑 userId를 묶어준다
    // data.forEach((el) => {
    //   if (el.userId == userId) {
    //     el.videoSids = socket.id;
    //     return false; // forEach문 종료하기.
    //   }
    // });
    data.map((el) => {
      if (el.roomId === roomId) {
        if (el.roomData.userId === userId) {
          el.roomData.videoSids = socket.id;
        }
      }
    });

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

  //NOTE: 대기방 -> 게임방 으로 입장. 입력받은 룸으로 매칭.
  socket.on("gameStart", (roomId, userId) => {
    //요청하는 사람의 Id 잡기. 화상 소켓 채팅
    socket["userId"] = socket.id;

    // {nickname: "~~", socket.id: "일반채팅+게임", videoSids:"화상채팅", card:[[],[]], black: 1  }
  });

  //NOTE: 게임 로직 구현
  //첫 패를 선택하는 부분
  socket.on("selectFirstCard", ({ userId, black, roomId }, addMyCard) => {
    //흰색 카드의 수 설정.
    const whiteCard = 3 - black;

    //카드를 먼저 선택해준 후.
    let count = 0;
    let arr1 = [];
    let flag = 0;
    for (let j = 0; j < data.length; j++) {
      if (data[j].roomId === roomId) {
        flag = j;
        break;
      }
    }

    for (let i = 0; count < black; i++) {
      const number = Math.floor(Math.random() * 12); //시작할때는 조커가 없어야한다.

      if (data[flag].blackCardList[number] === null) {
        data[flag].blackCardList[number] = userId;
        arr1 = [...arr1, { color: "black", value: number }];
        count++;
      }
    }

    count = 0;
    for (let i = 0; count < whiteCard; i++) {
      number = Math.floor(Math.random() * 12);

      if (data[flag].whiteCardList[number] === null) {
        data[flag].whiteCardList[number] = userId;
        arr1 = [...arr1, { color: "white", value: number }];
        count++;
      }
    }

    // 카드들의 잔여 갯수 count 해주기.
    countBlack = 0;
    countWhite = 0;
    for (let i = 0; i < data[flag].blackCardList.length; i++) {
      if (data[flag].blackCardList[i] !== null) {
        countBlack++;
      }

      if (data[flag].whiteCardList[i] !== null) {
        countWhite++;
      }
    }

    socket["card"] = arr1;

    socket.card
      .sort((a, b) => a.value - b.value)
      .sort((a, b) => {
        if (a.value === b.value) {
          if (a.color < b.color) return -1;
          else if (b.color < a.color) return 1;
          else return 0;
        }
      });

    //유저들의 전체 카드에 대한 정보를 쏴줘야한다.

    const userIdAndCard = { userId, cards: socket.card }; //기존 변수 부분 TODO: 추후 제거

    for (let i = 0; i < data.length; i++) {
      if (data[flag].roomData[i].userId == userId) {
        data[flag].roomData[i].cards = socket.card;
        break;
      }
    }
    console.log(data)
    gamingUser = [...gamingUser, userIdAndCard];
    
    
    if (data[flag].roomData.length === 4) {
      //진행자에 대한 추가 정보가 필요.  첫 스타트 유저에 대한 정보를 보내주면 좋다.
      //user nickname
      //cache 에서 user의 순서를 받아와서 전송
      console.log("나 들어왔음")
      console.log(data[flag])
      socket
        .to(roomId)
        .emit("allUsersFirstCard", data);
    }
  });

  //진행자의 순서에 대한 정보가 필요하다.
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
      count = 0;
      for (let i = 0; count < 1; i++) {
        number = Math.floor(Math.random() * 13);

        if (whiteCardList[number] === null) {
          whiteCardList[number] = userId;
          arr1 = [...arr1, { color: "white", value: number }];
          count++;
        }
      }
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
