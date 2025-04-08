import { EventEmitter } from "events";
import { type Db, MongoClient } from "mongodb";
import { ZodDatabaseNotConnectedError } from "./errors";

interface MongoConnection {
  db: Db | null;
  client: MongoClient | null;
  isConnected: boolean;
}

interface DatabaseOptions {
  client: MongoClient;
  dbName: string;
  maxRetries?: number;
  retryDelay?: number;
}

class ZodMongoDatabaseConnection extends EventEmitter {
  private static instance: ZodMongoDatabaseConnection;
  private connection: MongoConnection = {
    db: null,
    client: null,
    isConnected: false,
  };
  private connectionPromise: Promise<void> | null = null;
  private maxRetries = 5;
  private retryDelay = 1000;

  /**
   * Gets the singleton instance of ZodMongoDatabaseConnection.
   * If no instance exists, creates a new one.
   * @returns The singleton instance of ZodMongoDatabaseConnection
   */
  public static getInstance(): ZodMongoDatabaseConnection {
    if (!ZodMongoDatabaseConnection.instance) {
      ZodMongoDatabaseConnection.instance = new ZodMongoDatabaseConnection();
    }
    return ZodMongoDatabaseConnection.instance;
  }

  /**
   * Private constructor to enforce singleton pattern.
   * Sets a higher limit for max listeners since this is a singleton.
   */
  private constructor() {
    super();
    // Set a higher limit for max listeners since this is a singleton
    this.setMaxListeners(20);
  }

  /**
   * Sets up the database connection with the provided options.
   * @param options - Configuration options for the database connection
   * @param options.client - The MongoDB client instance
   * @param options.dbName - Name of the database to connect to
   * @param options.maxRetries - Maximum number of connection retry attempts (optional)
   * @param options.retryDelay - Delay between retry attempts in milliseconds (optional)
   * @returns Promise that resolves when the connection is established
   */
  public async setup(options: DatabaseOptions): Promise<void> {
    this.maxRetries = options.maxRetries ?? this.maxRetries;
    this.retryDelay = options.retryDelay ?? this.retryDelay;

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.establishConnection(options);
    return this.connectionPromise;
  }

  /**
   * Establishes a connection to the MongoDB database with retry logic.
   * @param options - Configuration options for the database connection
   * @throws Error if all connection attempts fail
   */
  private async establishConnection(options: DatabaseOptions): Promise<void> {
    if (this.connection.isConnected) {
      return;
    }

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        // Ensure the client is connected
        await options.client.connect();

        this.connection.client = options.client;
        this.connection.db = options.client.db(options.dbName);
        this.connection.isConnected = true;

        this.emit("connected");

        // Setup connection monitoring
        options.client.on("close", () => {
          this.connection.isConnected = false;
          this.emit("disconnected");
        });

        options.client.on("error", (error) => {
          this.emit("error", error);
          console.error("MongoDB connection error:", error);
        });

        return;
      } catch (error) {
        attempts++;
        console.error(`MongoDB connection attempt ${attempts} failed:`, error);
        if (attempts === this.maxRetries) {
          this.emit("error", error);
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * Disconnects from the MongoDB database and cleans up resources.
   * @returns Promise that resolves when the disconnection is complete
   */
  public async disconnect(): Promise<void> {
    if (this.connection.client) {
      await this.connection.client.close();
      this.connection.client = null;
      this.connection.db = null;
      this.connection.isConnected = false;
      this.connectionPromise = null;
      this.emit("disconnected");
    }
  }

  /**
   * Gets the database instance.
   * @returns The MongoDB database instance
   * @throws ZodDatabaseNotConnectedError if the database is not connected
   */
  public getDb(): Db {
    if (!this.connection.db || !this.connection.isConnected) {
      throw new ZodDatabaseNotConnectedError();
    }
    return this.connection.db;
  }

  /**
   * Ensures the database connection is established and returns the database instance.
   * @returns Promise that resolves with the MongoDB database instance
   * @throws ZodDatabaseNotConnectedError if the database connection cannot be established
   */
  public async ensureDb(): Promise<Db> {
    if (!this.connection.db) {
      await this.retryGetDb();
    }
    return this.connection.db!;
  }

  /**
   * Retries to get the database connection with a timeout.
   * @throws ZodDatabaseNotConnectedError if the connection cannot be established within the timeout
   */
  private async retryGetDb(): Promise<void> {
    if (!this.connection.isConnected) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.removeListener("connected", onConnected); // Clean up listener on timeout
          reject(new ZodDatabaseNotConnectedError());
        }, this.maxRetries * this.retryDelay);

        const onConnected = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.once("connected", onConnected);
      });
    }

    if (!this.connection.db) {
      throw new ZodDatabaseNotConnectedError();
    }
  }

  /**
   * Checks if the database is currently connected.
   * @returns true if the database is connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connection.isConnected;
  }
}

// Export the singleton instance
export const zodMongoDatabaseConnection =
  ZodMongoDatabaseConnection.getInstance();
