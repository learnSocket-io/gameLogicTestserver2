'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
class User {
  userId;
  hand;
  isPrepared;
  isAlive;
  constructor(userId) {
    this.isPrepared = false;
    this.userId = userId;
    this.hand = new Set();
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
exports.default = User;
