import Card from './card';
import User from './user';

export default class Room {
  roomId: number;

  users: User[];

  isPlaying: boolean;

  blackCardsOnTable: Card[];

  whiteCardsOnTable: Card[];

  order: number[];

  constructor(roomId: number) {
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
      this.blackCardsOnTable.push(new Card('black', i));
      this.whiteCardsOnTable.push(new Card('white', i));
    }

    this.users.forEach((user) => user.initial());

    this.order = this.users.map((user) => user.userId); // TODO: 순서 섞기
  }

  findUser(userId: number) {
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
