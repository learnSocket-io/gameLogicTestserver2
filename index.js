// TODO: 한 줄 씩 가자.
// TODO: endstate 말고 구현이 먼저


// TODO: code가 이쁜건 나중에 리팩토링


//redis-cli -h redis-game-ro.rbvg10.ng.0001.apn2.cache.amazonaws.com

//소켓 통신
// 추가되는 카드만 주고 받기.
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const socketEventHandler = require('./socket-event-handler');

require('dotenv').config();

const app = express();

app.use(cors());
// redis 기본 정리 및 연결 시작
const client = createClient({
  url: process.env.REDIS_HOST,
});
const connectClient = async () => {
  return await client.connect();
};

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    method: ['GET', 'POST'],
  },
});

// FIXME: redis 쓰기.
connectClient()
  .then(async () => {
    await client.set('qwerqwerqwer', '연결완료');
    const value = await client.get('qwerqwerqwer');
    console.log(value);
  })
  .catch((err) => {
    console.log(err.message);
  });

// 쓰기 test.
client.set('qwer', 'qwerqwerqwerqwer');

// hoho 에 "field", "value" 를 넣는다.
// client.hSet("hoho", "field", "value");
// client.hgetall('friends')

// 한 개 씩 추가 해야할 때 + 중복 제거도 해 줌.
// client.sadd('fruits', 'apple', 'orange', 'pear', 'banana', 'apple')
// client.sadd('fruits', 'lulu')
// client.smembers('fruits')

const users = {};
const socketToRoom = {};

// test code

// NOTE: 변수 설정 부분

const rooms = [{}];

let whiteCard = 0;
let sampleData = [
  {
    roomId: 3,
    blackCardList: [null, 1, 1, 1, 2, 2, 2, null, null, null, null, null, null],
    whiteCardList: [null, 4, 4, 4, 3, 3, 3, null, null, null, null, null, null],
    users: [
      {
        userId: 4,
        gameSids: '12D73jwD0ioJeJLGAAAD',
        cards: [
          { color: 'white', value: 1 },
          { color: 'white', value: 2 },
          { color: 'white', value: 3 },
        ],
      },
      {
        userId: 1,
        gameSids: '12D73jwD0ioJeJLGAAAD',
        cards: [
          { color: 'black', value: 1 },
          { color: 'black', value: 2 },
          { color: 'black', value: 3 },
        ],
      },
      {
        userId: 2,
        gameSids: '12D73jwD0ioJeJLGAAAD',
        cards: [
          { color: 'black', value: 4 },
          { color: 'black', value: 5 },
          { color: 'black', value: 6 },
        ],
      },
      {
        userId: 3,
        gameSids: '12D73jwD0ioJeJLGAAAD',
        cards: [
          { color: 'white', value: 4 },
          { color: 'white', value: 5 },
          { color: 'white', value: 6 },
        ],
      },
    ],
  },
];

let countBlack = 0;
let countWhite = 0;
let gamingUser = [];

// NOTE:
// console.log(socket.id); sids정보

// NOTE: SOCKET IO 시작 부분
io.on('connection', (socket) => {
  socket['nickName'] = '익명';

  const user = { nickname: '익명' };

  socket.onAny((e) => {
    console.log(`SocketEvent:${e}`);

    // await client.sAdd("fruits", "apple", "orange", "pear", "banana", "apple");
    // await client.sAdd("fruits", "lulu");

    // 비동기 형식으로 접근해야만 함.
    // await client.set("testCode", "test msg");  ---- O
    // const testCode = await client.get("testCode");  ---- O
    // console.log("testcode 대한 값 표현", testCode);  ---- O
    // const qwer = await client.get("qwer");  ---- O
    // console.log("qwer에 대한 값 표현", qwer);  ---- O
  });

  const sendMessage = (data, addMyMessage) => {
    console.log(data);
    socket.to(data.room).emit('receive-message', data.msg);
    addMyMessage(data.msg);
  };

  socket.on('send-message', sendMessage);

  socket.on('join-room', ({ roomId, userId, people }, gameStartFn) => {
    socket['userId'] = userId;
    // 접속했을때 redis에서 userId를 가져올 것인지?
    socket.join(roomId);
    // const sample = { userId, gameSids: socket.id };

    const room = rooms.find((room) => room.roomId === roomId);

    if (room) {
      room.users.push({ userId, gameSids: socket.id });
    } else {
      //data가 없다면 새로 생성
      // "null,".repeat(13) 반복 작업에 대한 구현
      rooms.push({
        roomId,
        blackCardList: new Array(13).fill(null),
        whiteCardList: new Array(13).fill(null),
        users: [{ userId, gameSids: socket.id }],
      });
    }

    rooms.map((room) => {
      if (room.users.length === people) {
        // 명세서 작성하기.

        socket.to(roomId).emit('game-starts');
        gameStartFn();

        io.to(roomId).emit('game-starts');
      }
    });
  });

  const getPlace = ({ roomId, userId, people }, fn) => {
    console.log('getPlace user실행:', userId);
    rooms.map((el) => {
      if (el.roomId == roomId && el.users.length === people) {
        console.log('수정해야할 데이터', el.users);
        let count = 0;
        let userTemp = [];

        for (let i = 0; i < people; i++) {
          if (el.users[i].userId === userId) {
            for (let j = 2; j < people; j = (j + 1) % people) {
              userTemp.push(el.users[j]);
              count++;
              if (count === people) {
                break;
              }
            }
            if (count === people) {
              break;
            }
          }
        }

        el.users = userTemp;
        //TODO: data가 가는지 확인하고, 필요한 data가 무엇인지 알고 바꿔서 전해주기
        // 유저 기준으로의 순서와 //
        fn(rooms);
      }
    });
  };

  socket.on('get-place', getPlace);

  // TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:
  // TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:  이 밑에 남은 것도 TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:
  // TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:   TS로 옮겨야 함   TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:
  // TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:TODO:


  socket.on('nickName', (nickName) => {
    socket['nickName'] = nickName;
  });

  socket.on('whisper', (nickName, msg, addMyMessage) => {
    const targetSoc = [...io.sockets.sockets];
    const target = targetSoc.filter((el) => el[1].nickName === nickName);
    if (target[0][0]) socket.to(target[0][0]).emit('receive_message', msg);
    addMyMessage(msg);
  });

  // NOTE: 화상채팅
  socket.on('joinRtcRoom', ({ roomID }) => {
    console.log(roomID);

    rooms[roomId].users;

    // if (users[roomID]) {
    //   const length = users[roomID].length;
    //   if (length === 4) {
    //     socket.emit('room full');
    //     return;
    //   }
    //   users[roomID].push(socket.id);
    // } else {
    //   users[roomID] = [socket.id];
    // }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit('all users', usersInThisRoom);
  });

  socket.on('sending signal', (payload) => {
    io.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });
  socket.on('returning signal', (payload) => {
    io.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on('disconnect', () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
  });

  // NOTE: 대기방 -> 게임방 으로 입장. 입력받은 룸으로 매칭.
  socket.on('gameStart', (roomId, userId) => {
    // 요청하는 사람의 Id 잡기. 화상 소켓 채팅
    socket['userId'] = socket.id;

    // {nickname: "~~", socket.id: "일반채팅+게임", videoSids:"화상채팅", card:[[],[]], black: 1  }
  });

  // NOTE: 게임 로직 구현
  // 첫 패를 선택하는 부분
  socket.on('selectFirstCard', ({ userId, black, roomId }, addMyCard) => {
    // 흰색 카드의 수 설정.
    const whiteCard = 3 - black;

    // 카드를 먼저 선택해준 후.
    let count = 0;
    let arr1 = [];
    let flag = 0;

    for (let j = 0; j < rooms.length; j++) {
      if (rooms[j].roomId === roomId) {
        flag = j;
        break;
      }
    }
    console.log('flag console test', flag);
    for (let i = 0; count < black; i++) {
      const number = Math.floor(Math.random() * 12); //시작할때는 조커가 없어야한다.

      if (rooms[flag].blackCardList[number] === null) {
        rooms[flag].blackCardList[number] = userId;
        arr1 = [...arr1, { color: 'black', value: number }];
        count++;
      }
    }

    count = 0;
    for (let i = 0; count < whiteCard; i++) {
      number = Math.floor(Math.random() * 12);

      if (rooms[flag].whiteCardList[number] === null) {
        rooms[flag].whiteCardList[number] = userId;
        arr1 = [...arr1, { color: 'white', value: number }];
        count++;
      }
    }

    // 카드들의 잔여 갯수 count 해주기.
    countBlack = 0;
    countWhite = 0;
    for (let i = 0; i < rooms[flag].blackCardList.length; i++) {
      if (rooms[flag].blackCardList[i] !== null) {
        countBlack++;
      }

      if (rooms[flag].whiteCardList[i] !== null) {
        countWhite++;
      }
    }

    socket['card'] = arr1;

    socket.card
      .sort((a, b) => a.value - b.value)
      .sort((a, b) => {
        if (a.value === b.value) {
          if (a.color < b.color) return -1;
          else if (b.color < a.color) return 1;
          else return 0;
        }
      });

    // 유저들의 전체 카드에 대한 정보를 쏴줘야한다.

    const userIdAndCard = { userId, cards: socket.card }; // 기존 변수 부분 TODO: 추후 제거

    for (let i = 0; i < rooms.length; i++) {
      //오류난 부분 체크필요 ㄱ
      if (rooms[flag].users[i].userId == userId) {
        rooms[flag].users[i].cards = socket.card;
        break;
      }
    }

    if (rooms[flag].users.length === 4) {
      // 진행자에 대한 추가 정보가 필요.  첫 스타트 유저에 대한 정보를 보내주면 좋다.
      // user nickname
      // cache 에서 user의 순서를 받아와서 전송
      socket
        .to(roomId)
        .emit('allUsersFirstCard', rooms, { countBlack, countWhite });
    }
  });

  // 진행자의 순서에 대한 정보가 필요하다.
  // 가져올 타일을 선택하는 기능. //받은 타일이 조커인지, 숫자인지에 대한 분기가 필요하다.
  socket.on('selectCard', (roomId, userId, black) => {
    for (let j = 0; j < rooms.length; j++) {
      if (rooms[j].roomId === roomId) {
        flag = j;
        break;
      }
    }

    if (black) {
      //black인 경우
      let count = 0;
      let arr1 = [];
      for (let i = 0; count < 1; i++) {
        // FIXME: 가지고 있는 값 내에서 랜덤을 가져오도록 구현하면 서버에 부담이 줄것이라 생각
        const number = Math.floor(Math.random() * 13);
        if (rooms[flag].blackCardList[number] === null) {
          rooms[flag].blackCardList[number] = userId;
          //FIXME white처럼 카드에 대한 정보를 담기 위한 로직 필요
          count++;
        }
      }
    } else {
      // white인 경우
      count = 0;
      for (let i = 0; count < 1; i++) {
        number = Math.floor(Math.random() * 13);

        if (rooms[flag].whiteCardList[number] === null) {
          rooms[flag].whiteCardList[number] = userId;

          //FIXME: 유저 정보의 index를 찾아서 넣어줘야한다.
          // 데이터를 어떻게 저장할 것인지 + 상대방에게 안보이게끔 로직을 어떻게 구현할 것인지.
          // 콜백함수에 대한 리턴과 , 그 외 user들에 대한 카드별 return null 구현 고민
          //data[flag].users[].card = { color: "white", value: number }];
          count++;
        }
      }
    }
  });

  // 상대를 지목하는 기능
  // 지목한 상대의 카드들에 대한 정보를 보내줘야 한다.
  // 지목한 카드의 정보를 비교해서 맞는지 틀린지에 대한 return 필요
  socket.on('selectUser', (userId, getCard) => {
    for (i = 0; i < gamingUser.length; i++) {
      if (gamingUser[i].userId == userId) {
        getCard(gamingUser[i]);
        break;
      }
    }
  });
});

// http 연결시 3000으로 진행하기 때문에 다른 port 값을 지정한것?
server.listen(3001, () => {
  console.log('Server is Listening');
});
