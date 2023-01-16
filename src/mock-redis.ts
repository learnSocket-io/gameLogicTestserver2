import Room from './room';

type Memory = {
  [key: string]: any;
};

class MockRedisClient {
  memory: Memory;

  constructor() {
    this.memory = {};
  }

  async set(key: string, value: string) {
    this.memory[key] = value;
  }

  async get(key: string) {
    return this.memory[key];
  }

  async del(key: string) {
    delete this.memory[key];
  }

  async rPush(key: string, ...args: string[]) {
    
  }


  async exist(key: string) {
    return Object.hasOwn(this.memory, key) ? 1 : 0;
  }

  
}

const database: {
  rooms: {
    [key: number]: Room;
  };
} = { rooms: {} };

const testRoom = new Room(1);

database.rooms[testRoom.roomId] = testRoom;

export function createClient() {
  return new MockRedisClient();
}
