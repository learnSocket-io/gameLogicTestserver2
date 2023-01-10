// Check the connection status of the Redis client instance.

const { createClient } = require("redis");

const client = createClient();

console.log("Before client.connect()...");

// 연결 시작
const connectClient = async () => {
  return await client.connect();
};
const connectPromise = connectClient();
//연결 확인
console.log("After client.connect()...");

//  console.log(
//    `client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`
//  );

//await connectPromise;
// console.log("Afer connectPromise has resolved...");

// // isOpen will return True here as the client's socket is open now.
// // isReady will return True here, client is ready to use.
// console.log(
//   `client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`
// );

//await client.quit();
