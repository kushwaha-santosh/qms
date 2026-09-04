import { NextResponse } from "next/server";

import {
    AUTH_COOKIE_NAME,
    getLogoutCookieOptions,
} from "../../../../lib/auth/auth.js";

export async function POST() {
    try {
        const response = NextResponse.json(
            {
                success: true,
                message: "Logged out successfully.",
            },
            {
                status: 200,
            }
        );


        response.cookies.set(
            AUTH_COOKIE_NAME,
            "",
            getLogoutCookieOptions()
        );

        return response;


    } catch (error) {
        console.error("Logout error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to logout.",
            },
            {
                status: 500,
            }
        );

    }
}
