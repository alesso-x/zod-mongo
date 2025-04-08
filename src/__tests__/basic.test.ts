import { z } from "zod";
import { ZodMongoRepository, ZodMongoDocument } from "..";

// Define the base user schema
const baseUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// Define the complete user schema with MongoDB fields
type UserDocument = ZodMongoDocument<z.infer<typeof baseUserSchema>>;

describe("ZodMongoRepository", () => {
  let userRepository: ZodMongoRepository<UserDocument>;

  it("should create a repository", () => {
    expect(true).toBe(true);
  });

  beforeAll(async () => {
    // Create repository
    userRepository = new ZodMongoRepository({
      collectionName: "users",
      schema: baseUserSchema,
    });
  });

  beforeEach(async () => {
    // Clear the collection before each test
    const collection = await userRepository.collection();
    await collection.deleteMany({});
  });

  it("should insert and find a user", async () => {
    // Insert a user
    const { doc: user } = await userRepository.insertOne({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });

    expect(user).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });
    expect(user._id).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();

    // Find the user
    const foundUser = await userRepository.findOne({
      email: "john@example.com",
    });
    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe("John Doe");
  });

  it("should update a user", async () => {
    // Insert a user
    const { doc: user } = await userRepository.insertOne({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });

    // Update the user
    await userRepository.updateOne(
      { email: "john@example.com" },
      { $set: { age: 31 } }
    );

    // Find the updated user
    const updatedUser = await userRepository.findOne({
      email: "john@example.com",
    });
    expect(updatedUser?.age).toBe(31);
  });

  it("should delete a user", async () => {
    // Insert a user
    const { doc: user } = await userRepository.insertOne({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });

    // Delete the user
    await userRepository.deleteOne({ email: "john@example.com" });

    // Verify the user is deleted
    const deletedUser = await userRepository.findOne({
      email: "john@example.com",
    });
    expect(deletedUser).toBeNull();
  });

  it("should validate input data", async () => {
    // Try to insert invalid data
    await expect(
      userRepository.insertOne({
        name: "John Doe",
        email: "invalid-email", // Invalid email
        age: 30,
      })
    ).rejects.toThrow();
  });
});
