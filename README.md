# zod-mongo

A thin wrapper around MongoDB that allows you to define your models using Zod schemas. This library provides type-safe MongoDB operations with runtime validation using Zod.

## Features

- Type-safe MongoDB operations
- Runtime validation using Zod schemas
- Automatic handling of `_id`, `createdAt`, and `updatedAt` fields
- Full TypeScript support
- Comprehensive CRUD operations
- Strict type checking for filters and updates

## Installation

```bash
npm install TODO
```

## Quick Start

```typescript
import { z } from "zod";
import { ZodMongoRepository, ObjectId } from "zod-mongo";

// Define your schema using Zod
const userSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// Create a repository
const userRepository = new ZodMongoRepository({
  collectionName: "users",
  schema: userSchema,
});

// Create a user
const { doc: user } = await userRepository.insertOne({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
});

// Find a user
const foundUser = await userRepository.findOne({ email: "john@example.com" });

// Update a user
await userRepository.updateOne(
  { email: "john@example.com" },
  { $set: { age: 31 } }
);
```

## MongoDB Connection

Before using the repository, you need to connect to your MongoDB database. Here's how to set it up:

```typescript
import { MongoClient } from "mongodb";
import { ZodMongoDatabaseConnection } from "zod-mongo";

// Create MongoClient
const client = new MongoClient("mongodb://localhost:27017");

// Setup the database connection
await ZodMongoDatabaseConnection.setup({
  client,
  dbName: "my-database",
});

// Listen for connection events
ZodMongoDatabaseConnection.on("connected", () => {
  console.log("Connected to MongoDB");
});

ZodMongoDatabaseConnection.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
});

ZodMongoDatabaseConnection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
  process.exit(1);
});
```

## Extended Repository Example

You can extend the `ZodMongoRepository` class to create custom repositories with domain-specific methods:

```typescript
import { z } from "zod";
import { ObjectId } from "mongodb";
import { ZodMongoDocument, ZodMongoRepository } from "zod-mongo";

// Define your schema
const userProfileSchema = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.string(),
  hasCompletedOnboarding: z.boolean(),
});

type UserProfile = ZodMongoDocument<z.infer<typeof userProfileSchema>>;

// Create a custom repository
class UserProfileRepository extends ZodMongoRepository<UserProfile> {
  constructor() {
    super({
      collectionName: "user_profiles",
      schema: userProfileSchema,
    });
  }

  // Custom method to get or create a profile
  async getOrCreateProfile(userId: string): Promise<UserProfile> {
    const existingProfile = await this.findOne({ userId });
    if (existingProfile) {
      return existingProfile;
    }

    const { doc } = await this.insertOne({
      userId,
      hasCompletedOnboarding: false,
    });
    return doc;
  }
}

// Usage example
async function main() {
  const profileRepo = new UserProfileRepository();

  // Get or create a profile
  const profile = await profileRepo.getOrCreateProfile("user123");
}
```

## API Reference

### Repository Methods

The repository provides the same methods as the MongoDB client, with two additional methods:

- `findOneStrict(filter, options?)`: Find a single document (throws if not found)
- `exists(filter, options?)`: Check if documents exist

Standard MongoDB methods:

- `insertOne(input, options?)`: Insert a single document
- `insertMany(input[], options?)`: Insert multiple documents
- `findOne(filter, options?)`: Find a single document
- `find(filter, options?)`: Find multiple documents
- `findCursor(filter, options?)`: Get a cursor for streaming results
- `updateOne(filter, update, options?)`: Update a single document
- `updateMany(filter, update, options?)`: Update multiple documents
- `findOneAndUpdate(filter, update, options)`: Find and update a document
- `deleteOne(filter, options?)`: Delete a single document
- `deleteMany(filter, options?)`: Delete multiple documents

### Type Definitions

- `ZodMongoDocumentInput<T>`: Input type for documents (excludes `_id`, `createdAt`, `updatedAt`)
- `ZodMongoDocument<T>`: Complete document type including MongoDB fields

## Type Safety

The repository is fully type-safe, meaning:

- All operations are typed with your schema
- Filters and updates are strictly typed
- Return types are properly inferred
- Runtime validation ensures data integrity

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
