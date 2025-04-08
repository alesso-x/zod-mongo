import { MongoMemoryServer } from "mongodb-memory-server";

declare global {
  var __MONGOINSTANCE: MongoMemoryServer | null;
}

export default async function globalSetup() {
  global.__MONGOINSTANCE = await MongoMemoryServer.create();
}
