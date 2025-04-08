import { MongoClient } from "mongodb";
import { zodMongoDatabaseConnection } from "..";

beforeAll(async () => {
  if (!global.__MONGOINSTANCE) {
    throw new Error("MongoDB test instance is not running");
  }

  const client = new MongoClient(global.__MONGOINSTANCE.getUri());

  await zodMongoDatabaseConnection.setup({
    client,
    dbName: "zod-mongo-test",
  });

  // Clean up the database before each test file
  if (zodMongoDatabaseConnection.isConnected()) {
    const db = zodMongoDatabaseConnection.getDb();
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
});

afterAll(async () => {
  // Disconnect from the database
  if (zodMongoDatabaseConnection.isConnected()) {
    await zodMongoDatabaseConnection.disconnect();
  }
});
