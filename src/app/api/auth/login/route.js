import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/db/mongoose";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from "../../../../lib/auth/auth.js";
import { loginUser } from "../../../../services/auth/auth.service";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const { email, password, rememberMe = false } = body || {};

    const result = await loginUser({
      email,
      password,
      rememberMe,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        data: {
          user: result.user,
        },
      },
      {
        status: 200,
      },
    );

    // console.log("rememberMe:", rememberMe);

    // const cookieOptions = getAuthCookieOptions(rememberMe);

    // console.log("cookieOptions:", cookieOptions);
    /**
     * Store JWT in HTTP-only cookie.
     *
     * JavaScript running in the browser cannot read this cookie.
     */
    response.cookies.set(
      AUTH_COOKIE_NAME,
      result.token,
      getAuthCookieOptions(rememberMe),
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to login.",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}
