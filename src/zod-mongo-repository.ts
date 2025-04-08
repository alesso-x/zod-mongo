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

  async collection() {
    const db = await zodMongoDatabaseConnection.ensureDb();
    return db.collection<TSchema>(this.collectionName);
  }

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

  async findOne(
    filter: StrictFilter<TSchema>,
    options?: Omit<FindOptions, "timeoutMode">
  ): Promise<WithId<TSchema> | null> {
    const collection = await this.collection();
    return collection.findOne(filter as Filter<TSchema>, options);
  }

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

  async find(
    filter: StrictFilter<TSchema>,
    options?: FindOptions
  ): Promise<WithId<TSchema>[]> {
    const collection = await this.collection();
    const cursor = collection.find(filter as Filter<TSchema>, options);
    return cursor.toArray();
  }

  async findCursor(
    filter: StrictFilter<TSchema>,
    options?: FindOptions
  ): Promise<FindCursor<WithId<TSchema>>> {
    const collection = await this.collection();
    return collection.find(filter as Filter<TSchema>, options);
  }

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

  async deleteOne(
    filter: StrictFilter<TSchema>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const collection = await this.collection();
    return collection.deleteOne(filter as Filter<TSchema>, options);
  }

  async deleteMany(
    filter: StrictFilter<TSchema>,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    const collection = await this.collection();
    return collection.deleteMany(filter as Filter<TSchema>, options);
  }

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
