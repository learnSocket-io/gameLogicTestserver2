'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const card_1 = __importDefault(require('./card'));
class Room {
  roomId;
  users;
  isPlaying;
  blackCardsOnTable;
  whiteCardsOnTable;
  order;
  constructor(roomId) {
    this.roomId = roomId;
    this.isPlaying = false;
    this.users = [];
    this.blackCardsOnTable = [];
    this.whiteCardsOnTable = [];
    this.order = [];
  }
  initial() {
    this.isPlaying = true;
    for (let i = 0; i < 13; i++) {
      this.blackCardsOnTable.push(new card_1.default('black', i));
      this.whiteCardsOnTable.push(new card_1.default('white', i));
    }
    this.users.forEach((user) => user.initial());
    this.order = this.users.map((user) => user.userId);
  }
  findUser(userId) {
    for (let i = 0; i < this.users.length; i++) {
      if ((this.users[i].userId = userId)) return this.users[i];
    }
  }
  isReady() {
    const users = this.users.length;
    const preparedUsers = this.users.reduce(
      (count, user) => count + (user.isPrepared ? 1 : 0),
      0
    );
    return users === preparedUsers;
  }
}
exports.default = Room;
