import Room from "./room";

export default class UserData {
  userId: number;

  username: string;
  
  currentRoom?: Room;

  constructor({ userId, username }: { userId: number; username: string }) {
    this.userId = userId;
    this.username = username;
  }
}
