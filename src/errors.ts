/**
 * Base error class for all ZodMongo errors.
 * Provides consistent error handling and stack trace capture.
 */
export class ZodMongoBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a document matching the specified filter cannot be found in the database.
 * @param message - Error message describing the failure
 * @param filter - The filter criteria used to search for the document
 */
export class ZodDocumentNotFoundError extends ZodMongoBaseError {
  constructor(
    message: string,
    public readonly filter: Record<string, unknown>
  ) {
    super(message);
  }
}

/**
 * Error thrown when attempting to perform database operations before establishing a connection.
 * This error indicates that the connect() method needs to be called before any database operations.
 */
export class ZodDatabaseNotConnectedError extends ZodMongoBaseError {
  constructor() {
    super("Database not connected. Call connect() first.");
  }
}
