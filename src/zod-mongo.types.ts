import { ObjectId, type WithId } from "mongodb";

export type ZodMongoDocumentInput<T> = Omit<
  T,
  "_id" | "createdAt" | "updatedAt"
> & {
  /** if not provided, the class will generate a new ObjectId */
  _id?: ObjectId;
};

export type ZodMongoDocument<T> = WithId<T> & {
  /** not necessary since ObjectId has a timestamp */
  createdAt: Date;
  updatedAt: Date;
};
