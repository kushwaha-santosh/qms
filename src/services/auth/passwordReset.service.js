import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "../../models/User.js";

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * ==========================================================
 * REQUEST PASSWORD RESET
 * ==========================================================
 *
 * Important:
 * Always return the same public response whether or not
 * the email exists.
 */
export const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw createError("Email is required.", 400);
  }

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+passwordResetToken +passwordResetExpires");

  /**
   * Do not reveal whether the email exists.
   */
  if (!user) {
    return {
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };
  }

  /**
   * Generate cryptographically secure token.
   */
  const rawToken = crypto.randomBytes(32).toString("hex");

  /**
   * Store only the hash in MongoDB.
   */
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  /**
   * Token valid for 30 minutes.
   */
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;

  await user.save();

  return {
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",

    /**
     * The controller will use this token to send the email.
     * It is never stored in the database.
     */
    resetToken: rawToken,
    user,
  };
};

/**
 * ==========================================================
 * RESET PASSWORD
 * ==========================================================
 */
export const resetPassword = async ({ token, password }) => {
  if (!token) {
    throw createError("Password reset token is required.", 400);
  }

  if (!password) {
    throw createError("New password is required.", 400);
  }

  if (password.length < 8) {
    throw createError("Password must be at least 8 characters long.", 400);
  }

  /**
   * Hash supplied token before searching.
   */
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: new Date(),
    },
  }).select("+password +passwordResetToken +passwordResetExpires");

  if (!user) {
    throw createError(
      "This password reset link is invalid or has expired.",
      400,
    );
  }

  /**
   * Hash the new password.
   */
  const hashedPassword = await bcrypt.hash(password, 12);

  user.password = hashedPassword;

  /**
   * Existing passwordChangedAt field.
   */
  user.passwordChangedAt = new Date();

  /**
   * Reset tokens are single-use.
   */
  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  await user.save();

  return {
    success: true,
    message: "Your password has been reset successfully. You can now sign in.",
  };
};
