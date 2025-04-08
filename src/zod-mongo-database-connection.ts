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

  public static getInstance(): ZodMongoDatabaseConnection {
    if (!ZodMongoDatabaseConnection.instance) {
      ZodMongoDatabaseConnection.instance = new ZodMongoDatabaseConnection();
    }
    return ZodMongoDatabaseConnection.instance;
  }

  private constructor() {
    super();
    // Set a higher limit for max listeners since this is a singleton
    this.setMaxListeners(20);
  }

  public async setup(options: DatabaseOptions): Promise<void> {
    this.maxRetries = options.maxRetries ?? this.maxRetries;
    this.retryDelay = options.retryDelay ?? this.retryDelay;

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.establishConnection(options);
    return this.connectionPromise;
  }

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

  public getDb(): Db {
    if (!this.connection.db || !this.connection.isConnected) {
      throw new ZodDatabaseNotConnectedError();
    }
    return this.connection.db;
  }

  public async ensureDb(): Promise<Db> {
    if (!this.connection.db) {
      await this.retryGetDb();
    }
    return this.connection.db!;
  }

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

  public isConnected(): boolean {
    return this.connection.isConnected;
  }
}

// Export the singleton instance
export const zodMongoDatabaseConnection =
  ZodMongoDatabaseConnection.getInstance();
