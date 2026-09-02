import mongoose from "mongoose";

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri =
    uri ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/amrita_connect";

  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  return mongoose.connect(connectionUri);
}

export * from "./models";
export { mongoose };
