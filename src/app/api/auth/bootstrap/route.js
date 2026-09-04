import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "../../../../lib/db/mongoose";
import User from "../../../../models/User";

export async function POST(request) {
  try {
    await connectDB();

    // ==========================================================
    // SECURITY: Only one SUPER_ADMIN can be bootstrapped
    // ==========================================================

    const existingSuperAdmin = await User.findOne({
      role: "SUPER_ADMIN",
    }).lean();

    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "SUPER_ADMIN already exists. Bootstrap is disabled.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // READ REQUEST
    // ==========================================================

    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!firstName) {
      return NextResponse.json(
        {
          success: false,
          message: "First name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // EMAIL DUPLICATE CHECK
    // ==========================================================

    const existingUser = await User.findOne({
      email,
    }).lean();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // HASH PASSWORD
    // ==========================================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // ==========================================================
    // CREATE SUPER ADMIN
    // ==========================================================

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,

      role: "SUPER_ADMIN",

      // SUPER_ADMIN is global.
      organizationId: null,

      status: "ACTIVE",
    });

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,
        message: "SUPER_ADMIN created successfully.",
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            status: user.status,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("SUPER_ADMIN bootstrap error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to create SUPER_ADMIN.",
      },
      {
        status: 500,
      }
    );
  }
}