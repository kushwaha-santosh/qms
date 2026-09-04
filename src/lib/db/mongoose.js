import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined in the environment variables."
  );
}

const globalForMongoose = globalThis;

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (globalForMongoose.mongoose.conn) {
    return globalForMongoose.mongoose.conn;
  }

  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose.connect(
      MONGODB_URI,
      {
        bufferCommands: false,
      }
    );
  }

  try {
    globalForMongoose.mongoose.conn =
      await globalForMongoose.mongoose.promise;

    console.log("MongoDB connected successfully.");

    return globalForMongoose.mongoose.conn;
  } catch (error) {
    globalForMongoose.mongoose.promise = null;

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
}