import { NextResponse } from "next/server";

import {
  verifyEmailConnection,
  sendEmail,
} from "@/services/email/email.service.js";

export async function GET() {
  try {
    const result = await verifyEmailConnection();

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("SMTP verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "SMTP connection failed.",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const to = String(body?.to || "").trim();

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient email is required.",
        },
        {
          status: 400,
        },
      );
    }

    const result = await sendEmail({
      to,
      subject: "QMS AI SMTP Test Email",
      text: `
This is a test email from QMS AI.

If you received this email, your Nodemailer SMTP configuration is working correctly.

Regards,
QMS AI
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>QMS AI SMTP Test</h2>

          <p>
            This is a test email from QMS AI.
          </p>

          <p>
            If you received this email, your Nodemailer SMTP
            configuration is working correctly.
          </p>

          <p>
            Regards,<br />
            <strong>QMS AI</strong>
          </p>
        </div>
      `.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully.",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Test email failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send test email.",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
