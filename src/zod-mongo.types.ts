import { ObjectId, type WithId } from "mongodb";
import { z } from "zod";

/**
 * Represents the timestamp fields that are automatically managed by MongoDB.
 */
export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Represents the schema for a MongoDB document.
 * This type omits the MongoDB-specific fields (_id, createdAt, updatedAt) from the base type T,
 * while allowing an optional _id field for cases where a specific ObjectId needs to be provided.
 * If _id is not provided, a new ObjectId will be generated.
 */
export type ZodMongoSchema<T> = Omit<T, "_id" | keyof Timestamps> & {
  /** if not provided, the class will generate a new ObjectId */
  _id?: ObjectId;
} & {
  [K in keyof Timestamps]?: never;
};

/**
 * Represents a complete MongoDB document with all required fields.
 * This type extends the base type T with MongoDB's WithId type and adds
 * the standard timestamp fields (createdAt and updatedAt).
 * The createdAt field is included for consistency, though it's not strictly
 * necessary since ObjectId already contains a timestamp.
 */
export type ZodMongoDocument<T> = WithId<T> & Timestamps;

/**
 * Helper type to infer a MongoDB document type directly from a Zod schema.
 * This combines the steps of inferring the schema type and wrapping it with ZodMongoDocument.
 *
 * Example:
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * type UserDocument = InferMongoDocument<typeof userSchema>;
 * ```
 */
export type InferMongoDocument<T extends z.ZodType> = ZodMongoDocument<
  z.infer<T>
>;
