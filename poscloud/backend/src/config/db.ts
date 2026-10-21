import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = (process.env.MONGODB_URI || "").trim();
const dbName = process.env.MONGODB_DB || "restaurant_pos";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.length > 0);
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      clientPromise = client.connect().catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return await clientPromise;
  } catch (error: any) {
    console.warn("MongoDB connection attempt failed, falling back to local memory store:", error?.message || error);
    return null;
  }
}

export async function getDatabase(): Promise<Db | null> {
  const c = await getMongoClient();
  if (!c) return null;
  try {
    return c.db(dbName);
  } catch {
    return null;
  }
}
