import { NextResponse } from "next/server";

import { connectDB } from "../../../lib/db/mongoose";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "QMS API is healthy.",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed.",
      },
      {
        status: 500,
      }
    );
  }
}