import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "7d";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const JWT_REMEMBER_ME_EXPIRES_IN = process.env.JWT_REMEMBER_ME_EXPIRES_IN;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

const secret = new TextEncoder().encode(JWT_SECRET);

const JWT_ISSUER = "qms-next";
const JWT_AUDIENCE = "qms-next-users";

export const AUTH_COOKIE_NAME = "qms_auth";

// ==========================================================
// SESSION DURATIONS
// ==========================================================

// Remember Me OFF
// Short-lived authentication session.
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

// Remember Me ON
// Persistent authentication session.
export const AUTH_REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ==========================================================
// BASE COOKIE OPTIONS
// ==========================================================

const BASE_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const durationToSeconds = (duration) => {
  const value = String(duration || "").trim();

  const match = value.match(/^(\d+)([smhd])$/i);

  if (!match) {
    throw new Error(
      `Invalid JWT duration: ${duration}. Use formats such as 30m, 8h, 7d.`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * multipliers[unit];
};
// ==========================================================
// CREATE AUTH JWT
// ==========================================================

export const createAuthToken = async ({
  userId,
  role,
  organizationId = null,
  rememberMe = false,
}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const expiresIn = rememberMe ? JWT_REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;

  return new SignJWT({
    userId: String(userId),
    role: role || null,
    organizationId: organizationId ? String(organizationId) : null,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(secret);
};

// ==========================================================
// VERIFY AUTH JWT
// ==========================================================

export const verifyAuthToken = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      userId: payload.userId || null,
      role: payload.role || null,
      organizationId: payload.organizationId || null,
    };
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return null;
  }
};

// ==========================================================
// GET AUTH TOKEN FROM REQUEST COOKIE
// ==========================================================

export const getAuthToken = (request) => {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value || null;
};

// ==========================================================
// GET AUTH SESSION
// ==========================================================

export const getAuthSession = async (request) => {
  const token = getAuthToken(request);

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
};

// ==========================================================
// AUTH COOKIE OPTIONS
// ==========================================================
//
// Remember Me OFF:
//   No maxAge
//   Browser session cookie
//
// Remember Me ON:
//   maxAge = 30 days
//   Persistent cookie
//
// ==========================================================

export const getAuthCookieOptions = (rememberMe = false) => {
  const options = {
    ...BASE_AUTH_COOKIE_OPTIONS,
  };

  if (rememberMe) {
    options.maxAge = durationToSeconds(JWT_REMEMBER_ME_EXPIRES_IN);
  } else {
    options.maxAge = options.maxAge = durationToSeconds(JWT_EXPIRES_IN);
  }

  return options;
};

// ==========================================================
// LOGOUT COOKIE OPTIONS
// ==========================================================

export const getLogoutCookieOptions = () => ({
  ...BASE_AUTH_COOKIE_OPTIONS,
  maxAge: 0,
});
