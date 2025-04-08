import { ObjectId, type WithId } from "mongodb";

/**
 * Represents the input type for creating or updating a MongoDB document.
 * This type omits the MongoDB-specific fields (_id, createdAt, updatedAt) from the base type T,
 * while allowing an optional _id field for cases where a specific ObjectId needs to be provided.
 * If _id is not provided, a new ObjectId will be generated.
 */
export type ZodMongoDocumentInput<T> = Omit<
  T,
  "_id" | "createdAt" | "updatedAt"
> & {
  /** if not provided, the class will generate a new ObjectId */
  _id?: ObjectId;
};

/**
 * Represents a complete MongoDB document with all required fields.
 * This type extends the base type T with MongoDB's WithId type and adds
 * the standard timestamp fields (createdAt and updatedAt).
 * The createdAt field is included for consistency, though it's not strictly
 * necessary since ObjectId already contains a timestamp.
 */
export type ZodMongoDocument<T> = WithId<T> & {
  /** not necessary since ObjectId has a timestamp */
  createdAt: Date;
  updatedAt: Date;
};
