// Check the connection status of the Redis client instance.

const { createClient } = require("redis");

//EC2에서 연결할때는 경로 분기를 바꿔줘야한다.
const client = createClient({
  url: process.env.REDIS_HOST,
});

console.log("Before client.connect()...");

// 연결 시작
const connectClient = async () => {
  return await client.connect();
};
connectClient()
  .then(() => {
    //연결 확인
    console.log("After client.connect()...");
  })
  .catch((err) => {
    console.log(err.message);
  });



console.log(
  `client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`
);

//await connectPromise;
// console.log("Afer connectPromise has resolved...");

// // isOpen will return True here as the client's socket is open now.
// // isReady will return True here, client is ready to use.
// console.log(
//   `client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`
// );

//await client.quit();
