import { z } from "zod";
import { ZodMongoRepository } from "../zod-mongo-repository";
import { ZodMongoDocument } from "../zod-mongo.types";

// Define test schemas
const baseSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

type TestDocument = ZodMongoDocument<z.infer<typeof baseSchema>>;

describe("Timestamp Management", () => {
  let repository: ZodMongoRepository<TestDocument>;
  let noTimestampsRepo: ZodMongoRepository<TestDocument>;

  beforeEach(async () => {
    repository = new ZodMongoRepository({
      collectionName: "test_collection",
      schema: baseSchema,
      timestamps: true,
    });

    noTimestampsRepo = new ZodMongoRepository({
      collectionName: "test_collection_no_timestamps",
      schema: baseSchema,
      timestamps: false,
    });

    // Clear collections before each test
    const collection = await repository.collection();
    await collection.deleteMany({});
    const noTimestampsCollection = await noTimestampsRepo.collection();
    await noTimestampsCollection.deleteMany({});
  });

  describe("insertOne", () => {
    it("should add timestamps when enabled", async () => {
      const { doc } = await repository.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
      expect(doc.createdAt).toEqual(doc.updatedAt);
    });

    it("should not add timestamps when disabled", async () => {
      const { doc } = await noTimestampsRepo.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(doc).not.toHaveProperty("createdAt");
      expect(doc).not.toHaveProperty("updatedAt");
    });
  });

  describe("insertMany", () => {
    it("should add timestamps to all documents when enabled", async () => {
      const docs = [
        { name: "John", email: "john@example.com" },
        { name: "Jane", email: "jane@example.com" },
      ];

      await repository.insertMany(docs);
      const results = await repository.findMany({});

      results.forEach((doc) => {
        expect(doc.createdAt).toBeInstanceOf(Date);
        expect(doc.updatedAt).toBeInstanceOf(Date);
        expect(doc.createdAt).toEqual(doc.updatedAt);
      });
    });

    it("should not add timestamps when disabled", async () => {
      const docs = [
        { name: "John", email: "john@example.com" },
        { name: "Jane", email: "jane@example.com" },
      ];

      await noTimestampsRepo.insertMany(docs);
      const results = await noTimestampsRepo.findMany({});

      results.forEach((doc) => {
        expect(doc).not.toHaveProperty("createdAt");
        expect(doc).not.toHaveProperty("updatedAt");
      });
    });
  });

  describe("updateOne", () => {
    it("should update updatedAt when timestamps are enabled", async () => {
      const { doc: initialDoc } = await repository.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      await repository.updateOne(
        { _id: initialDoc._id },
        { $set: { name: "John Updated" } }
      );

      const updatedDoc = await repository.findOne({ _id: initialDoc._id });
      expect(updatedDoc?.updatedAt).toBeInstanceOf(Date);
      expect(updatedDoc?.createdAt).toBeInstanceOf(Date);
      expect(updatedDoc?.name).toBe("John Updated");
    });

    it("should not add timestamps when disabled", async () => {
      const { doc: initialDoc } = await noTimestampsRepo.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      await noTimestampsRepo.updateOne(
        { _id: initialDoc._id },
        { $set: { name: "John Updated" } }
      );

      const updatedDoc = await noTimestampsRepo.findOne({
        _id: initialDoc._id,
      });
      expect(updatedDoc).not.toHaveProperty("updatedAt");
      expect(updatedDoc).not.toHaveProperty("createdAt");
      expect(updatedDoc?.name).toBe("John Updated");
    });
  });

  describe("findOneAndUpdate", () => {
    it("should update updatedAt when timestamps are enabled", async () => {
      const { doc: initialDoc } = await repository.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      await repository.findOneAndUpdate(
        { _id: initialDoc._id },
        { $set: { name: "John Updated" } }
      );

      const updatedDoc = await repository.findOne({ _id: initialDoc._id });
      expect(updatedDoc?.updatedAt).toBeInstanceOf(Date);
      expect(updatedDoc?.createdAt).toBeInstanceOf(Date);
      expect(updatedDoc?.name).toBe("John Updated");
    });

    it("should not add timestamps when disabled", async () => {
      const { doc: initialDoc } = await noTimestampsRepo.insertOne({
        name: "John Doe",
        email: "john@example.com",
      });

      await noTimestampsRepo.findOneAndUpdate(
        { _id: initialDoc._id },
        { $set: { name: "John Updated" } }
      );

      const updatedDoc = await noTimestampsRepo.findOne({
        _id: initialDoc._id,
      });
      expect(updatedDoc).not.toHaveProperty("updatedAt");
      expect(updatedDoc).not.toHaveProperty("createdAt");
      expect(updatedDoc?.name).toBe("John Updated");
    });
  });
});
