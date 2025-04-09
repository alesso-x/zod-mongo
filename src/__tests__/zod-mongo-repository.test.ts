import { ObjectId } from "mongodb";
import { z } from "zod";
import { ZodMongoRepository } from "../zod-mongo-repository";
import { ZodMongoDocument } from "../zod-mongo.types";

// Define a test schema
const testSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

type TestDocument = ZodMongoDocument<z.infer<typeof testSchema>>;

describe("ZodMongoRepository", () => {
  let repository: ZodMongoRepository<TestDocument>;

  beforeEach(async () => {
    repository = new ZodMongoRepository<TestDocument>({
      collectionName: "test_collection",
      schema: testSchema,
    });

    // Clear the collection before each test
    const collection = await repository.collection();
    await collection.deleteMany({});
  });

  describe("findMany", () => {
    it("should find multiple documents matching the filter", async () => {
      // Insert test documents
      await repository.insertMany([
        {
          name: "John",
          age: 30,
          email: "john@example.com",
        },
        {
          name: "Jane",
          age: 25,
          email: "jane@example.com",
        },
        {
          name: "Bob",
          age: 15,
          email: "bob@example.com",
        },
      ]);

      const result = await repository.findMany({ age: { $gt: 20 } });

      expect(result).toHaveLength(2);
      expect(result.map((doc) => doc.name).sort()).toEqual(["Jane", "John"]);
    });

    it("should apply field projection when specified", async () => {
      // Insert test document
      await repository.insertOne({
        name: "John",
        age: 30,
        email: "john@example.com",
      });

      const result = await repository.findMany(
        { age: { $gt: 20 } },
        { fields: ["name", "age"] }
      );

      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("age");
      expect(result[0]).not.toHaveProperty("email");
    });

    it("should apply sorting when specified", async () => {
      // Insert test documents
      await repository.insertMany([
        {
          name: "John",
          age: 30,
          email: "john@example.com",
        },
        {
          name: "Jane",
          age: 25,
          email: "jane@example.com",
        },
        {
          name: "Bob",
          age: 35,
          email: "bob@example.com",
        },
      ]);

      const result = await repository.findMany(
        { age: { $gt: 20 } },
        { sort: { age: 1 } }
      );

      expect(result.map((doc) => doc.name)).toEqual(["Jane", "John", "Bob"]);
    });

    it("should apply limit and skip when specified", async () => {
      // Insert test documents
      await repository.insertMany([
        {
          name: "John",
          age: 30,
          email: "john@example.com",
        },
        {
          name: "Jane",
          age: 25,
          email: "jane@example.com",
        },
        {
          name: "Bob",
          age: 35,
          email: "bob@example.com",
        },
      ]);

      const result = await repository.findMany(
        { age: { $gt: 20 } },
        { limit: 2, skip: 1, sort: { age: 1 } }
      );

      expect(result).toHaveLength(2);
      expect(result.map((doc) => doc.name)).toEqual(["John", "Bob"]);
    });
  });
});
