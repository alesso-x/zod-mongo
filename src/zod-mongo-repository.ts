import {
  type BulkWriteOptions,
  type CountDocumentsOptions,
  type DeleteOptions,
  type DeleteResult,
  type Document,
  type Filter,
  type FindCursor,
  type FindOneAndUpdateOptions,
  type FindOptions,
  type InsertManyResult,
  type InsertOneOptions,
  type InsertOneResult,
  ObjectId,
  type OptionalUnlessRequiredId,
  type StrictFilter,
  type StrictUpdateFilter,
  type UpdateFilter,
  type UpdateOptions,
  type UpdateResult,
  type WithId,
} from "mongodb";
import { z } from "zod";
import { zodMongoDatabaseConnection } from "./zod-mongo-database-connection";
import { ZodDocumentNotFoundError } from "./errors";
import { ZodMongoDocument, ZodMongoDocumentInput } from "./zod-mongo.types";

export class ZodMongoRepository<TSchema extends ZodMongoDocument<Document>> {
  protected collectionName: string;
  protected schema: z.ZodType<ZodMongoDocumentInput<TSchema>>;

  constructor(input: {
    collectionName: string;
    schema: z.ZodType<ZodMongoDocumentInput<TSchema>>;
  }) {
    this.collectionName = input.collectionName;
    this.schema = input.schema;
  }

  /**
   * Gets the MongoDB collection for this repository.
   * @returns A promise that resolves to the MongoDB collection.
   */
  async collection() {
    const db = await zodMongoDatabaseConnection.ensureDb();
    return db.collection<TSchema>(this.collectionName);
  }

  /**
   * Inserts a single document into the collection.
   * @param input - The document to insert, validated against the schema.
   * @param options - Optional MongoDB insert options.
   * @returns A promise that resolves to an object containing the inserted document and the insert result.
   */
  async insertOne(
    input: ZodMongoDocumentInput<TSchema>,
    options?: InsertOneOptions
  ): Promise<{ doc: TSchema; result: InsertOneResult<TSchema> }> {
    const validated = this.schema.parse({ _id: new ObjectId(), ...input });

    const doc = {
      createdAt: new Date(),
      updatedAt: new Date(),
      ...validated,
    } as TSchema;

    const collection = await this.collection();
    const result = await collection.insertOne(
      doc as OptionalUnlessRequiredId<TSchema>,
      options
    );
    return { doc, result };
  }

  /**
   * Inserts multiple documents into the collection.
   * @param input - Array of documents to insert, each validated against the schema.
   * @param options - Optional MongoDB bulk write options.
   * @returns A promise that resolves to the insert many result.
   */
  async insertMany(
    input: ZodMongoDocumentInput<TSchema>[],
    options?: BulkWriteOptions
  ): Promise<InsertManyResult<TSchema>> {
    const validated = input.map((item) =>
      this.schema.parse({ _id: new ObjectId(), ...item })
    );

    const docs = validated.map((item) => ({
      createdAt: new Date(),
      updatedAt: new Date(),
      ...item,
    }));

    const collection = await this.collection();
    return collection.insertMany(
      docs as OptionalUnlessRequiredId<TSchema>[],
      options
    );
  }

  /**
   * Finds a single document in the collection.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB find options.
   * @returns A promise that resolves to the found document or null if not found.
   */
  async findOne(
    filter: StrictFilter<TSchema>,
    options?: Omit<FindOptions, "timeoutMode">
  ): Promise<WithId<TSchema> | null> {
    const collection = await this.collection();
    return collection.findOne(filter as Filter<TSchema>, options);
  }

  /**
   * Finds a single document in the collection and throws an error if not found.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB find options.
   * @returns A promise that resolves to the found document.
   * @throws {ZodDocumentNotFoundError} If no document is found.
   */
  async findOneStrict(
    filter: StrictFilter<TSchema>,
    options?: Omit<FindOptions, "timeoutMode">
  ): Promise<WithId<TSchema>> {
    const result = await this.findOne(filter, options);
    if (!result) {
      throw new ZodDocumentNotFoundError(
        `Document not found in collection ${this.collectionName}`,
        filter as Record<string, unknown>
      );
    }
    return result;
  }

  /**
   * Finds multiple documents in the collection.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB find options.
   * @returns A promise that resolves to an array of found documents.
   */
  async find(
    filter: StrictFilter<TSchema>,
    options?: FindOptions
  ): Promise<WithId<TSchema>[]> {
    const collection = await this.collection();
    const cursor = collection.find(filter as Filter<TSchema>, options);
    return cursor.toArray();
  }

  /**
   * Returns a cursor for finding documents in the collection.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB find options.
   * @returns A promise that resolves to a MongoDB cursor.
   */
  async findCursor(
    filter: StrictFilter<TSchema>,
    options?: FindOptions
  ): Promise<FindCursor<WithId<TSchema>>> {
    const collection = await this.collection();
    return collection.find(filter as Filter<TSchema>, options);
  }

  /**
   * Updates a single document in the collection.
   * @param filter - The query filter to match documents.
   * @param update - The update operations to perform.
   * @param options - Optional MongoDB update options.
   * @returns A promise that resolves to the update result.
   */
  async updateOne(
    filter: StrictFilter<TSchema>,
    update: StrictUpdateFilter<TSchema>,
    options?: UpdateOptions
  ): Promise<UpdateResult<TSchema>> {
    if ("$set" in update) {
      (update.$set as any) = {
        ...update.$set,
        updatedAt: new Date(),
      };
    } else {
      update = { $set: { updatedAt: new Date() } } as UpdateFilter<TSchema>;
    }

    const collection = await this.collection();
    return collection.updateOne(
      filter as Filter<TSchema>,
      update as UpdateFilter<TSchema>,
      options
    );
  }

  /**
   * Updates multiple documents in the collection.
   * @param filter - The query filter to match documents.
   * @param update - The update operations to perform.
   * @param options - Optional MongoDB update options.
   * @returns A promise that resolves to the update result.
   */
  async updateMany(
    filter: StrictFilter<TSchema>,
    update: StrictUpdateFilter<TSchema>,
    options?: UpdateOptions
  ): Promise<UpdateResult<TSchema>> {
    if ("$set" in update) {
      (update.$set as any) = {
        ...update.$set,
        updatedAt: new Date(),
      };
    } else {
      update = { $set: { updatedAt: new Date() } } as UpdateFilter<TSchema>;
    }

    const collection = await this.collection();
    return collection.updateMany(
      filter as Filter<TSchema>,
      update as UpdateFilter<TSchema>,
      options
    );
  }

  /**
   * Finds a document and updates it in one atomic operation.
   * @param filter - The query filter to match documents.
   * @param update - The update operations to perform.
   * @param options - MongoDB find and update options.
   * @returns A promise that resolves to the updated document.
   * @throws {ZodDocumentNotFoundError} If no document is found.
   */
  async findOneAndUpdate(
    filter: StrictFilter<TSchema>,
    update: StrictUpdateFilter<TSchema>,
    options: FindOneAndUpdateOptions
  ): Promise<WithId<TSchema>> {
    if ("$set" in update) {
      (update.$set as any) = {
        ...update.$set,
        updatedAt: new Date(),
      };
    } else {
      update = { $set: { updatedAt: new Date() } } as UpdateFilter<TSchema>;
    }

    const collection = await this.collection();
    const result = await collection.findOneAndUpdate(
      filter as Filter<TSchema>,
      update as UpdateFilter<TSchema>,
      options
    );

    if (!result) {
      throw new ZodDocumentNotFoundError(
        `Document not found in collection ${this.collectionName}`,
        filter as Record<string, unknown>
      );
    }

    return result;
  }

  /**
   * Deletes a single document from the collection.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB delete options.
   * @returns A promise that resolves to the delete result.
   */
  async deleteOne(
    filter: StrictFilter<TSchema>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const collection = await this.collection();
    return collection.deleteOne(filter as Filter<TSchema>, options);
  }

  /**
   * Deletes multiple documents from the collection.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB delete options.
   * @returns A promise that resolves to the delete result.
   */
  async deleteMany(
    filter: StrictFilter<TSchema>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const collection = await this.collection();
    return collection.deleteMany(filter as Filter<TSchema>, options);
  }

  /**
   * Checks if any documents exist matching the given filter.
   * @param filter - The query filter to match documents.
   * @param options - Optional MongoDB count documents options.
   * @returns A promise that resolves to true if documents exist, false otherwise.
   */
  async exists(
    filter: StrictFilter<TSchema>,
    options?: CountDocumentsOptions
  ): Promise<boolean> {
    const collection = await this.collection();
    const count = await collection.countDocuments(
      filter as Filter<TSchema>,
      options
    );
    return count > 0;
  }
}
