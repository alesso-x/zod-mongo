export class ZodMongoBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ZodDocumentNotFoundError extends ZodMongoBaseError {
  constructor(
    message: string,
    public readonly filter: Record<string, unknown>
  ) {
    super(message);
  }
}

export class ZodDatabaseNotConnectedError extends ZodMongoBaseError {
  constructor() {
    super("Database not connected. Call connect() first.");
  }
}
