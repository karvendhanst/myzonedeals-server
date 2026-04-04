import { configDotenv } from "dotenv";
import mongoose from "mongoose";

configDotenv({ path: "./src/.env" });

export const connectDB = async () => {
  console.log("Trying to connect to MongoDB...");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env file!");
    return;
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connection established successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose connection lost.");
    });

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    console.log("Connected to MongoDB host:", conn.connection.host);
  } catch (error) {
    console.error("Database Connection Failed:", error);
  }
};