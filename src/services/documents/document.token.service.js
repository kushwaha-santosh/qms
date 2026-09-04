import { SignJWT, jwtVerify } from "jose";

const DOCUMENT_TOKEN_SECRET = process.env.DOCUMENT_TOKEN_SECRET || process.env.JWT_SECRET;
const DOCUMENT_TOKEN_EXPIRES_IN = process.env.DOCUMENT_TOKEN_EXPIRES_IN || "10m";
const ISSUER = "qms-document-access";
const AUDIENCE = "qms-document-viewer";

if (!DOCUMENT_TOKEN_SECRET) {
  throw new Error("DOCUMENT_TOKEN_SECRET or JWT_SECRET is required for document access tokens.");
}

const secret = new TextEncoder().encode(DOCUMENT_TOKEN_SECRET);

const durationToSeconds = (value) => {
  if (typeof value === "number") return value;
  const match = String(value).trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return 600;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit] || 60);
};

export const createDocumentAccessToken = async ({ documentId, userId, organizationId }) => {
  const expiresIn = durationToSeconds(DOCUMENT_TOKEN_EXPIRES_IN);

  return new SignJWT({
    typ: "DOCUMENT_VIEW",
    documentId: String(documentId),
    userId: String(userId),
    organizationId: String(organizationId),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(secret);
};

export const verifyDocumentAccessToken = async (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid document access token.");
  }

  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (payload.typ !== "DOCUMENT_VIEW" || !payload.documentId || !payload.userId) {
    throw new Error("Invalid document access token.");
  }

  return payload;
};
