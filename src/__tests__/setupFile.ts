import { MongoClient } from "mongodb";
import { ZodMongoDatabaseConnection } from "..";

beforeAll(async () => {
  if (!global.__MONGOINSTANCE) {
    throw new Error("MongoDB test instance is not running");
  }

  const client = new MongoClient(global.__MONGOINSTANCE.getUri());

  await ZodMongoDatabaseConnection.setup({
    client,
    dbName: "zod-mongo-test",
  });

  // Clean up the database before each test file
  if (ZodMongoDatabaseConnection.isConnected()) {
    const db = ZodMongoDatabaseConnection.getDb();
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
});

afterAll(async () => {
  // Disconnect from the database
  if (ZodMongoDatabaseConnection.isConnected()) {
    await ZodMongoDatabaseConnection.disconnect();
  }
});
