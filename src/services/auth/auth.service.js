import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "@/models/User";
import { createAuthToken } from "@/lib/auth/auth.js";
import { sendPasswordResetEmail } from "@/services/email/email.service.js";

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

/**
 * Authenticate user using email/password.
 */
export const loginUser = async ({ email, password, rememberMe = false }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    const error = new Error("Email is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Password is required.");
    error.statusCode = 400;
    throw error;
  }

  /**
   * Password is normally excluded by the User model.
   * Login explicitly requests it.
   */
  const user = await User.findOne({
    email: normalizedEmail,
  })
    .select("+password")
    .lean();

  /**
   * Do not reveal whether the email exists.
   */
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  /**
   * Check account status before allowing authentication.
   */
  const status = String(user.status || "")
    .trim()
    .toUpperCase();

  if (status !== "ACTIVE") {
    const error = new Error(
      status === "SUSPENDED"
        ? "Your account has been suspended."
        : "Your account is inactive.",
    );

    error.statusCode = 403;
    throw error;
  }

  /**
   * Compare supplied password with hashed password.
   */
  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const role = normalizeRole(user.role);

  if (!role) {
    const error = new Error("Your account does not have a valid role.");

    error.statusCode = 403;
    throw error;
  }

  /**
   * SUPER_ADMIN is global and does not require an organization.
   *
   * Organization users must have an organization.
   */
  const organizationId = user.organizationId || null;

  if (role !== "SUPER_ADMIN" && !organizationId) {
    const error = new Error(
      "Your account is not associated with an organization.",
    );

    error.statusCode = 403;
    throw error;
  }

  /**
   * Create JWT.
   *
   * Notice that permissions are NOT stored in the JWT.
   */
  const token = await createAuthToken({
    userId: user._id,
    role,
    organizationId,
    rememberMe,
  });

  /**
   * Never return the password.
   */
  const safeUser = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role,
    status,
    organizationId,
  };

  return {
    token,
    user: safeUser,
  };
};

// ==========================================================
// PASSWORD RESET CONSTANTS
// ==========================================================

const PASSWORD_RESET_EXPIRY_MINUTES =
  process.env.PASSWORD_RESET_EXPIRY_MINUTES || 30;

const getAppUrl = () => {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return appUrl;
};

// ==========================================================
// HASH RESET TOKEN
// ==========================================================

const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// ==========================================================
// REQUEST PASSWORD RESET
// ==========================================================

export const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    const error = new Error("Email is required.");

    error.statusCode = 400;

    throw error;
  }

  /*
   * IMPORTANT:
   * We intentionally use the same response
   * whether the account exists or not.
   *
   * This prevents account enumeration.
   */

  const genericResponse = {
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };

  const user = await User.findOne({
    email: normalizedEmail,
  })
    .select("+passwordResetTokenHash +passwordResetTokenExpiresAt")
    .lean();

  if (!user) {
    return genericResponse;
  }

  /*
   * Only active users can initiate password recovery.
   *
   * We still return the same generic response.
   */
  const status = String(user.status || "")
    .trim()
    .toUpperCase();

  if (status !== "ACTIVE") {
    return genericResponse;
  }

  /*
   * Generate cryptographically secure token.
   */
  const rawToken = crypto.randomBytes(32).toString("hex");

  /*
   * Never store raw token in database.
   */
  const tokenHash = hashResetToken(rawToken);

  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000,
  );

  await User.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        passwordResetTokenHash: tokenHash,

        passwordResetTokenExpiresAt: expiresAt,
      },
    },
  );

  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(
    rawToken,
  )}`;

  /*
   * Send email.
   *
   * If SMTP fails, do NOT expose SMTP details
   * to the user.
   */
  try {
    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetUrl,
    });
  } catch (emailError) {
    /*
     * Remove the reset token if email delivery
     * failed. This prevents a token from remaining
     * active when the user never received it.
     */
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          passwordResetTokenHash: null,

          passwordResetTokenExpiresAt: null,
        },
      },
    );

    console.error("Password reset email failed:", emailError);

    const error = new Error("Unable to process the password reset request.");

    error.statusCode = 500;

    throw error;
  }

  return genericResponse;
};

// ==========================================================
// RESET PASSWORD
// ==========================================================

export const resetPassword = async ({ token, password, confirmPassword }) => {
  const rawToken = String(token || "").trim();

  if (!rawToken) {
    const error = new Error("Password reset token is required.");

    error.statusCode = 400;

    throw error;
  }

  if (!password) {
    const error = new Error("New password is required.");

    error.statusCode = 400;

    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters long.");

    error.statusCode = 400;

    throw error;
  }

  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match.");

    error.statusCode = 400;

    throw error;
  }

  const tokenHash = hashResetToken(rawToken);

  /*
   * Fetch token fields explicitly because
   * they use select:false.
   */
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
  })
    .select("+password +passwordResetTokenHash +passwordResetTokenExpiresAt")
    .exec();

  if (!user) {
    const error = new Error(
      "This password reset link is invalid or has expired.",
    );

    error.statusCode = 400;

    throw error;
  }

  /*
   * Check expiration.
   */
  if (
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt.getTime() < Date.now()
  ) {
    /*
     * Clean up expired token.
     */
    user.passwordResetTokenHash = null;

    user.passwordResetTokenExpiresAt = null;

    await user.save();

    const error = new Error(
      "This password reset link is invalid or has expired.",
    );

    error.statusCode = 400;

    throw error;
  }

  /*
   * Hash new password.
   */
  const hashedPassword = await bcrypt.hash(password, 12);

  /*
   * Update password and consume
   * the reset token.
   */
  user.password = hashedPassword;

  user.passwordChangedAt = new Date();

  user.passwordResetTokenHash = null;

  user.passwordResetTokenExpiresAt = null;

  await user.save();

  return {
    message: "Your password has been reset successfully. You can now sign in.",
  };
};
