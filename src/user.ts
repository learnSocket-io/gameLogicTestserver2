import Card from "./card";

export default class User {
  userId: number;

  hand: Set<Card>;

  isPrepared: boolean;

  isAlive: boolean;

  constructor(userId: number) {
    this.isPrepared = false;
    this.userId = userId;
    this.hand = new Set<Card>();
    this.isAlive = true;
  }

  prepare() {
    this.isPrepared = !this.isPrepared;
  }

  initial() {
    this.hand.clear();
    this.isPrepared = false;
    this.isAlive = true;
  }
}