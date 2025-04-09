import { Timestamps } from "./zod-mongo.types";

/**
 * Utility class for managing document timestamps.
 * Provides methods for adding and updating timestamp fields.
 */
export class TimestampManager {
  private static lastTimestamp: number = 0;

  /**
   * Adds timestamp fields to a document.
   * @param doc - The document to add timestamps to
   * @returns The document with timestamp fields added
   */
  static addTimestamps<T>(doc: T): T & Timestamps {
    const now = this.getNewTimestamp();
    return {
      ...doc,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Updates the updatedAt timestamp in an update operation.
   * @param update - The update operation to modify
   * @returns The update operation with updatedAt field added
   */
  static updateTimestamp<T>(update: T): T & { updatedAt: Date } {
    return {
      ...update,
      updatedAt: this.getNewTimestamp(),
    };
  }

  /**
   * Gets a new timestamp that is guaranteed to be different from the last one.
   * @returns A new Date object
   */
  private static getNewTimestamp(): Date {
    const now = Date.now();
    // Ensure the new timestamp is at least 1ms after the last one
    const newTimestamp = Math.max(now, this.lastTimestamp + 1);
    this.lastTimestamp = newTimestamp;
    return new Date(newTimestamp);
  }
}
