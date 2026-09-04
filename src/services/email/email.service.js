import nodemailer from "nodemailer";

// ==========================================================
// SMTP CONFIGURATION
// ==========================================================

const getSMTPConfig = () => {
  const host = String(process.env.SMTP_HOST || "").trim();

  const port = Number(process.env.SMTP_PORT || 587);

  const user = String(process.env.SMTP_USER || "").trim();

  const password = String(process.env.SMTP_PASSWORD || "");

  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";

  const from = String(process.env.SMTP_FROM || "").trim() || user;

  return {
    host,
    port,
    user,
    password,
    secure,
    from,
  };
};

// ==========================================================
// VALIDATE SMTP CONFIGURATION
// ==========================================================

const validateSMTPConfig = () => {
  const config = getSMTPConfig();

  if (!config.host) {
    throw new Error("SMTP_HOST is not configured.");
  }

  if (!config.port) {
    throw new Error("SMTP_PORT is not configured.");
  }

  if (!config.user) {
    throw new Error("SMTP_USER is not configured.");
  }

  if (!config.password) {
    throw new Error("SMTP_PASSWORD is not configured.");
  }

  if (!config.from) {
    throw new Error("SMTP_FROM is not configured.");
  }

  return config;
};

// ==========================================================
// CREATE TRANSPORTER
// ==========================================================

const createTransporter = () => {
  const config = validateSMTPConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,

    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};

// ==========================================================
// VERIFY SMTP CONNECTION
// ==========================================================

export const verifyEmailConnection = async () => {
  const transporter = createTransporter();

  await transporter.verify();

  return {
    success: true,
    message: "SMTP connection verified successfully.",
  };
};

// ==========================================================
// SEND EMAIL
// ==========================================================

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error("Recipient email address is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  const config = validateSMTPConfig();

  const transporter = createTransporter();

  const result = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });

  return result;
};

// ==========================================================
// PASSWORD RESET EMAIL
// ==========================================================

export const sendPasswordResetEmail = async ({ to, firstName, resetUrl }) => {
  const displayName = String(firstName || "").trim() || "there";

  const subject = "Reset your QMS AI password";

  const text = `
Hello ${displayName},

We received a request to reset your QMS AI password.

Use the link below to create a new password:

${resetUrl}

This password reset link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

For security reasons, the link can only be used once.

Regards,
QMS AI
Quality Management System
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your QMS AI password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f8fafc;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>
  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      overflow:hidden;
    "
  >

    <div
      style="
        padding:28px 32px;
        background:#020617;
        color:#ffffff;
      "
    >
      <div
        style="
          font-size:22px;
          font-weight:700;
        "
      >
        QMS AI
      </div>

      <div
        style="
          margin-top:4px;
          font-size:12px;
          color:#94a3b8;
        "
      >
        Quality Management System
      </div>
    </div>

    <div style="padding:32px;">

      <h1
        style="
          margin:0;
          font-size:24px;
          line-height:32px;
        "
      >
        Reset your password
      </h1>

      <p
        style="
          margin:18px 0 0;
          font-size:15px;
          line-height:24px;
          color:#475569;
        "
      >
        Hello ${displayName},
      </p>

      <p
        style="
          margin:12px 0 0;
          font-size:15px;
          line-height:24px;
          color:#475569;
        "
      >
        We received a request to reset your QMS AI password.
        Click the button below to create a new password.
      </p>

      <div style="margin:28px 0;">
        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:13px 22px;
            background:#020617;
            color:#ffffff;
            text-decoration:none;
            border-radius:10px;
            font-size:14px;
            font-weight:600;
          "
        >
          Reset Password
        </a>
      </div>

      <p
        style="
          margin:0;
          font-size:13px;
          line-height:21px;
          color:#64748b;
        "
      >
        This link will expire in 30 minutes and can only
        be used once.
      </p>

      <div
        style="
          margin-top:24px;
          padding:16px;
          background:#f8fafc;
          border-radius:10px;
          font-size:12px;
          line-height:20px;
          color:#64748b;
          word-break:break-all;
        "
      >
        If the button does not work, copy and paste this URL
        into your browser:
        <br />
        ${resetUrl}
      </div>

      <p
        style="
          margin:24px 0 0;
          font-size:13px;
          line-height:21px;
          color:#64748b;
        "
      >
        If you did not request this password reset,
        you can safely ignore this email.
      </p>

    </div>

    <div
      style="
        padding:20px 32px;
        border-top:1px solid #e2e8f0;
        font-size:11px;
        color:#94a3b8;
      "
    >
      © ${new Date().getFullYear()} QMS AI
    </div>

  </div>
</body>
</html>
`.trim();

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
};
