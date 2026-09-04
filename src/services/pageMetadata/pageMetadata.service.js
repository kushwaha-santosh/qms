import PageMetadata from "@/models/PageMetadata.js";
import { createAuditLogFromUser } from "@/services/auditLog/auditLog.service.js";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_KEYWORDS_LENGTH = 500;

// ==========================================================
// ERROR HELPER
// ==========================================================

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ==========================================================
// NORMALIZATION
// ==========================================================

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizePath = (value) => {
  const path = String(value || "").trim();

  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
};

// ==========================================================
// ACCESS CONTROL
// ==========================================================

const ensurePageMetadataAccess = (user) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  if (!["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role)) {
    throw createError(
      "You do not have permission to manage page metadata.",
      403,
    );
  }
};

// ==========================================================
// PAYLOAD NORMALIZATION
// ==========================================================

const normalizePayload = (data = {}) => {
  const key = normalizeKey(data.key);
  const path = normalizePath(data.path);

  const title = String(data.title || "").trim();

  const description = String(data.description || "").trim();

  const keywords = String(data.keywords || "").trim();

  if (!key) {
    throw createError("Page metadata key is required.", 400);
  }

  if (!path) {
    throw createError("Page metadata path is required.", 400);
  }

  if (!title) {
    throw createError("Page metadata title is required.", 400);
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw createError(
      `Title must not exceed ${MAX_TITLE_LENGTH} characters.`,
      400,
    );
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw createError(
      `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      400,
    );
  }

  if (keywords.length > MAX_KEYWORDS_LENGTH) {
    throw createError(
      `Keywords must not exceed ${MAX_KEYWORDS_LENGTH} characters.`,
      400,
    );
  }

  return {
    key,
    path,
    title,
    description,
    keywords,
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
  };
};

// ==========================================================
// SAFE RESPONSE
// ==========================================================

const toSafeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }

  return {
    _id: metadata._id,
    key: metadata.key,
    path: metadata.path,
    title: metadata.title,
    description: metadata.description || "",
    keywords: metadata.keywords || "",
    isActive: metadata.isActive !== false,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
};

// ==========================================================
// AUDIT DATA
// ==========================================================

const auditMetadata = (metadata) => ({
  key: metadata.key,
  path: metadata.path,
  title: metadata.title,
  description: metadata.description || "",
  keywords: metadata.keywords || "",
  isActive: metadata.isActive !== false,
});

// ==========================================================
// LIST
// ==========================================================
//
// IMPORTANT:
//
// MongoDB is the ONLY runtime source.
//
// There is NO fallback to:
// src/config/pageMetadata.js
//
// ==========================================================

export const listPageMetadata = async ({ user } = {}) => {
  ensurePageMetadataAccess(user);

  const databaseRows = await PageMetadata.find({}).sort({ path: 1 }).lean();

  return databaseRows.map((row) => ({
    ...toSafeMetadata(row),
    source: "DATABASE",
  }));
};

// ==========================================================
// GET BY KEY
// ==========================================================
//
// MongoDB only.
// If the record does not exist, return 404.
//
// ==========================================================

export const getPageMetadataByKey = async ({ user, pageKey } = {}) => {
  ensurePageMetadataAccess(user);

  const normalizedKey = normalizeKey(pageKey);

  if (!normalizedKey) {
    throw createError("Page metadata key is required.", 400);
  }

  const metadata = await PageMetadata.findOne({
    key: normalizedKey,
  }).lean();

  if (!metadata) {
    throw createError("Page metadata not found.", 404);
  }

  return {
    ...toSafeMetadata(metadata),
    source: "DATABASE",
  };
};

// ==========================================================
// CREATE / UPDATE
// ==========================================================

export const savePageMetadata = async ({
  user,
  pageKey = "",
  data,
  request = null,
} = {}) => {
  ensurePageMetadataAccess(user);

  const normalizedKey = normalizeKey(pageKey || data?.key);

  if (!normalizedKey) {
    throw createError("Page metadata key is required.", 400);
  }

  const normalized = normalizePayload({
    ...data,
    key: normalizedKey,
  });

  const existing = await PageMetadata.findOne({
    key: normalizedKey,
  }).lean();

  // ========================================================
  // DUPLICATE KEY
  // ========================================================

  const duplicateKey = await PageMetadata.findOne({
    key: normalized.key,
    ...(existing?._id
      ? {
          _id: {
            $ne: existing._id,
          },
        }
      : {}),
  }).lean();

  if (duplicateKey) {
    throw createError("Page metadata with this key already exists.", 409);
  }

  // ========================================================
  // DUPLICATE PATH
  // ========================================================

  const duplicatePath = await PageMetadata.findOne({
    path: normalized.path,
    ...(existing?._id
      ? {
          _id: {
            $ne: existing._id,
          },
        }
      : {}),
  }).lean();

  if (duplicatePath) {
    throw createError("Page metadata with this path already exists.", 409);
  }

  // ========================================================
  // UPDATE
  // ========================================================

  let updated;

  if (existing) {
    updated = await PageMetadata.findByIdAndUpdate(
      existing._id,
      {
        $set: normalized,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  // ========================================================
  // CREATE
  // ========================================================
  else {
    updated = (await PageMetadata.create(normalized)).toObject();
  }

  if (!updated) {
    throw createError("Page metadata could not be saved.", 500);
  }

  // ========================================================
  // AUDIT LOG
  // ========================================================

  await createAuditLogFromUser({
    user,
    request,
    action: existing ? "UPDATE" : "CREATE",
    module: "PAGE_METADATA",
    recordId: updated._id,

    description: existing
      ? `Page metadata for "${updated.path}" was updated.`
      : `Page metadata for "${updated.path}" was created.`,

    oldData: existing ? auditMetadata(existing) : null,

    newData: auditMetadata(updated),
  });

  return {
    ...toSafeMetadata(updated),
    source: "DATABASE",
  };
};

// Backwards compatibility
export const updatePageMetadata = savePageMetadata;

// ==========================================================
// UPDATE STATUS
// ==========================================================

export const updatePageMetadataStatus = async ({
  user,
  pageKey,
  isActive,
  request = null,
} = {}) => {
  ensurePageMetadataAccess(user);

  const normalizedKey = normalizeKey(pageKey);

  if (!normalizedKey) {
    throw createError("Page metadata key is required.", 400);
  }

  if (typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean.", 400);
  }

  const existing = await PageMetadata.findOne({
    key: normalizedKey,
  }).lean();

  if (!existing) {
    throw createError("Page metadata not found.", 404);
  }

  if (existing.isActive === isActive) {
    return {
      ...toSafeMetadata(existing),
      source: "DATABASE",
    };
  }

  const updated = await PageMetadata.findByIdAndUpdate(
    existing._id,
    {
      $set: {
        isActive,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!updated) {
    throw createError("Page metadata not found.", 404);
  }

  await createAuditLogFromUser({
    user,
    request,
    action: "STATUS_UPDATE",
    module: "PAGE_METADATA",
    recordId: updated._id,

    description:
      `Page metadata for "${updated.path}" status changed ` +
      `from "${existing.isActive ? "ACTIVE" : "INACTIVE"}" ` +
      `to "${updated.isActive ? "ACTIVE" : "INACTIVE"}".`,

    oldData: auditMetadata(existing),
    newData: auditMetadata(updated),
  });

  return {
    ...toSafeMetadata(updated),
    source: "DATABASE",
  };
};

// ==========================================================
// DELETE
// ==========================================================

export const deletePageMetadata = async ({
  user,
  pageKey,
  request = null,
} = {}) => {
  ensurePageMetadataAccess(user);

  const normalizedKey = normalizeKey(pageKey);

  if (!normalizedKey) {
    throw createError("Page metadata key is required.", 400);
  }

  const existing = await PageMetadata.findOne({
    key: normalizedKey,
  }).lean();

  if (!existing) {
    throw createError("Page metadata not found.", 404);
  }

  const deleted = await PageMetadata.findByIdAndDelete(existing._id);

  if (!deleted) {
    throw createError("Page metadata could not be deleted.", 500);
  }

  await createAuditLogFromUser({
    user,
    request,
    action: "DELETE",
    module: "PAGE_METADATA",
    recordId: existing._id,

    description: `Page metadata for "${existing.path}" was deleted.`,

    oldData: auditMetadata(existing),
    newData: null,
  });

  return {
    _id: existing._id,
    key: existing.key,
    path: existing.path,
  };
};

// ==========================================================
// EFFECTIVE PAGE METADATA
// ==========================================================
//
// This function is used by application pages when they need
// metadata.
//
// MongoDB is the ONLY source.
//
// No config fallback.
//
// ==========================================================
export const getEffectivePageMetadata = async (path) => {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath) {
    return null;
  }

  const databasePage = await PageMetadata.findOne({
    path: normalizedPath,
  }).lean();

  if (!databasePage) {
    return null;
  }

  if (databasePage.isActive === false) {
    return null;
  }

  return {
    ...toSafeMetadata(databasePage),
    source: "DATABASE",
  };
};
