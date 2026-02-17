import { MongoClient } from 'mongodb';
import { getSetting } from './sqlite';

let uri = process.env.MONGODB_URI;

// If not in env, try to get from SQLite synchronously
if (!uri) {
  try {
    uri = getSetting('mongodb_uri') || undefined;
  } catch (e) {
    console.warn("Failed to read MONGODB_URI from SQLite:", e);
  }
}

if (!uri) {
  // Instead of throwing, we can let it fail later or setup a dummy client that checks again? 
  // For now, let's keep the throw but make it informative, or maybe we just don't connect yet.
  // But clientPromise is exported, so we need something.
  // Let's rely on the assumption that if they are hitting pages needing DB, they have set it up.
  // If we are in the setup phase, we might not need this client yet.

  // However, top-level await is not supported in all contexts for this file structure easily without changing target.
  // better-sqlite3 is synchronous, so `getSetting` works.

  // If still no URI, we can't create a client.
  // We will assign a dummy value or handle it. 
  // Actually, let's just create a client with a placeholder if missing, 
  // but it will fail to connect. 
  // Better: Throw error if genuinely missing, forcing setup.
  // But wait, /setup page shouldn't crash if DB is not set.
  // The /setup page doesn't use this `clientPromise`! It accesses `getSetting`.
  // So it corresponds to the plan: if accessing DB pages, it will crash, which is fine if not set up.
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Create a promise that rejects, so usages will fail but app can start
  clientPromise = Promise.reject(new Error("MONGODB_URI not found in Env or Settings"));
} else {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function getDb(dbName: string = 'mongoadmin') {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getAdminDb() {
  const client = await clientPromise;
  return client.db().admin();
}
