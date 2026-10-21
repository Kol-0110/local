import { Request, Response } from "express";
import { getMongoClient, isMongoConfigured } from "../config/db";

export async function getStatus(req: Request, res: Response) {
  const configured = isMongoConfigured();
  if (!configured) {
    res.json({
      status: "ready",
      database: "local_memory",
      message: "Running in local storage fallback mode. Add MONGODB_URI in backend/.env to enable MongoDB Atlas.",
      connected: false,
    });
    return;
  }

  try {
    const client = await getMongoClient();
    if (!client) {
      res.json({
        status: "fallback",
        database: "local_memory",
        message: "MongoDB configured but could not connect, using fallback memory store.",
        connected: false,
      });
      return;
    }

    // Ping DB
    await client.db().command({ ping: 1 });
    res.json({
      status: "connected",
      database: "mongodb",
      message: "Connected to MongoDB successfully",
      connected: true,
    });
  } catch (error: any) {
    res.json({
      status: "fallback",
      database: "local_memory",
      message: error?.message || "Failed to reach MongoDB",
      connected: false,
    });
  }
}
