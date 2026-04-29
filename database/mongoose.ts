import mongoose from "mongoose";

function getMongoUri(): string {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not defined");
  }
  return mongodbUri;
}

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectToDb() {
  if (cached?.conn) {
    return cached.conn;
  }
  
  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(getMongoUri(), opts);
  }

  try {
    const isNewConnection = !cached!.conn;
    cached!.conn = await cached!.promise;
    if (isNewConnection) {
      console.info("Connected to MongoDB");
    }
  } catch (error) {
    cached!.promise = null;
    console.error("Error connecting to MongoDB. Please make sure MongoDB is running.", error);
    throw error;
  }

  return cached!.conn;
}

export default connectToDb;