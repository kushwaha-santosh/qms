import mongoose from "mongoose";

import Document from "@/models/Document.js";

import {
  saveUploadedDocument,
  deleteStoredDocument,
} from "@/services/documents/document.storage.js";

import { createAuditLog } from "@/services/auditLog/auditLog.service.js";

/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const error = (message, statusCode = 400) =>
  Object.assign(new Error(message), {
    statusCode,
  });

const normalizeTags = (tags) => {
  if (tags === undefined || tags === null) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const getOrgId = (user) => {
  if (!user) {
    throw error("Authentication required.", 401);
  }

  if (user.role === "SUPER_ADMIN") {
    return null;
  }

  if (!user.organizationId) {
    throw error("User is not associated with an organization.", 403);
  }

  return user.organizationId;
};

const scopeQuery = (user) => {
  if (!user) {
    throw error("Authentication required.", 401);
  }

  const isSuperAdmin = String(user.role || "").toUpperCase() === "SUPER_ADMIN";

  /*
   * ==========================================================
   * SUPER ADMIN
   * ==========================================================
   *
   * SUPER_ADMIN is a global user.
   *
   * Its organizationId is intentionally NULL.
   *
   * Therefore, do NOT require organization context and do
   * NOT assign a fake organization.
   *
   * Returning an empty query allows SUPER_ADMIN to access
   * documents belonging to any organization.
   */

  if (isSuperAdmin) {
    return {};
  }

  /*
   * ==========================================================
   * ORGANIZATION USER
   * ==========================================================
   *
   * All normal users must belong to an organization.
   */

  if (!user.organizationId) {
    throw error("User is not associated with an organization.", 403);
  }

  return {
    organizationId: user.organizationId,
  };
};

const scopeQuery121313 = (user) => {
  const organizationId = getOrgId(user);

  /*
   * SUPER_ADMIN is global.
   *
   * For document operations, SUPER_ADMIN still needs to
   * operate against a specific organization.
   *
   * If organizationId is present on the SUPER_ADMIN request,
   * scope to that organization.
   */

  if (user.role === "SUPER_ADMIN") {
    if (user.organizationId) {
      return {
        organizationId: user.organizationId,
      };
    }

    /*
     * A global SUPER_ADMIN without an organization cannot
     * access organization documents without an explicit
     * organization context.
     */

    throw error(
      "Organization context is required for document operations.",
      400,
    );
  }

  return {
    organizationId,
  };
};

/*
 * ==========================================================
 * NORMALIZE DOCUMENT PAYLOAD
 * ==========================================================
 */

const normalizePayload = (data = {}) => {
  const payload = {
    ...data,
  };

  if (payload.documentNumber !== undefined) {
    payload.documentNumber = String(payload.documentNumber || "")
      .trim()
      .toUpperCase();
  }

  if (payload.title !== undefined) {
    payload.title = String(payload.title || "").trim();
  }

  if (payload.documentType !== undefined) {
    payload.documentType = String(payload.documentType || "")
      .trim()
      .toUpperCase();
  }

  if (payload.category !== undefined) {
    payload.category = String(payload.category || "")
      .trim()
      .toUpperCase();
  }

  if (payload.department !== undefined) {
    payload.department = String(payload.department || "")
      .trim()
      .toUpperCase();
  }

  if (payload.revision !== undefined) {
    payload.revision = String(payload.revision || "0").trim();
  }

  if (payload.description !== undefined) {
    payload.description = String(payload.description || "").trim();
  }

  if (payload.status !== undefined) {
    payload.status = String(payload.status || "")
      .trim()
      .toUpperCase();
  }

  if (payload.statusComment !== undefined) {
    payload.statusComment = String(payload.statusComment || "").trim();
  }

  if (payload.fileSource !== undefined) {
    payload.fileSource = String(payload.fileSource || "")
      .trim()
      .toUpperCase();
  }

  if (payload.fileName !== undefined) {
    payload.fileName = String(payload.fileName || "").trim();
  }

  if (payload.fileStorageKey !== undefined) {
    payload.fileStorageKey = String(payload.fileStorageKey || "").trim();
  }

  if (payload.fileUrl !== undefined) {
    payload.fileUrl = String(payload.fileUrl || "").trim();
  }

  if (payload.mimeType !== undefined) {
    payload.mimeType = String(payload.mimeType || "").trim();
  }

  if (payload.tags !== undefined) {
    payload.tags = normalizeTags(payload.tags);
  }

  if (payload.owner === "") {
    payload.owner = null;
  }

  return payload;
};

/*
 * ==========================================================
 * RESOLVE REFERENCES
 * ==========================================================
 */

const resolveReferences = (payload) => {
  const result = {
    ...payload,
  };

  if (result.owner !== undefined && result.owner !== null) {
    if (!validId(result.owner)) {
      throw error("Invalid document owner ID.", 400);
    }

    result.owner = new mongoose.Types.ObjectId(result.owner);
  }

  if (
    result.effectiveDate !== undefined &&
    result.effectiveDate !== null &&
    result.effectiveDate !== ""
  ) {
    const date = new Date(result.effectiveDate);

    if (Number.isNaN(date.getTime())) {
      throw error("Invalid effective date.", 400);
    }

    result.effectiveDate = date;
  }

  if (
    result.reviewDate !== undefined &&
    result.reviewDate !== null &&
    result.reviewDate !== ""
  ) {
    const date = new Date(result.reviewDate);

    if (Number.isNaN(date.getTime())) {
      throw error("Invalid review date.", 400);
    }

    result.reviewDate = date;
  }

  if (
    result.expiryDate !== undefined &&
    result.expiryDate !== null &&
    result.expiryDate !== ""
  ) {
    const date = new Date(result.expiryDate);

    if (Number.isNaN(date.getTime())) {
      throw error("Invalid expiry date.", 400);
    }

    result.expiryDate = date;
  }

  return result;
};

/*
 * ==========================================================
 * AUDIT HELPER
 * ==========================================================
 */

const auditDocumentAction = async ({
  user,
  action,
  document,
  oldData = null,
  newData = null,
  description = "",
} = {}) => {
  try {
    await createAuditLog({
      user,
      organizationId: document?.organizationId || user?.organizationId || null,
      action,
      module: "DOCUMENTS",
      recordId: document?._id || null,
      description,
      oldData,
      newData,
    });
  } catch (auditError) {
    /*
     * Audit logging must never break the primary
     * document operation.
     */

    console.error("Document audit log error:", auditError);
  }
};

/*
 * ==========================================================
 * LIST DOCUMENTS
 * ==========================================================
 */

export const listDocuments = async ({
  user,
  page = 1,
  limit = 20,
  search = "",
  status = "",
  documentType = "",
  category = "",
  department = "",
  owner = "",
  fileSource = "",
} = {}) => {
  const query = {
    ...scopeQuery(user),
  };

  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (currentPage - 1) * currentLimit;

  const trimmedSearch = String(search || "").trim();

  if (trimmedSearch) {
    query.$or = [
      {
        documentNumber: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
      {
        title: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: trimmedSearch,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    query.status = String(status).trim().toUpperCase();
  }

  if (documentType) {
    query.documentType = String(documentType).trim().toUpperCase();
  }

  if (category) {
    query.category = String(category).trim().toUpperCase();
  }

  if (department) {
    query.department = String(department).trim().toUpperCase();
  }

  if (owner) {
    if (!validId(owner)) {
      throw error("Invalid document owner ID.", 400);
    }

    query.owner = owner;
  }

  if (fileSource) {
    query.fileSource = String(fileSource).trim().toUpperCase();
  }

  const [documents, total] = await Promise.all([
    Document.find(query)
      /*
       * IMPORTANT:
       *
       * Never expose the server filesystem path
       * to normal document API consumers.
       */
      .select("-fileAbsolutePath")
      .populate("organizationId", "name")
      .populate("owner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    Document.countDocuments(query),
  ]);

  return {
    documents,

    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

/*
 * ==========================================================
 * GET DOCUMENT BY ID
 * ==========================================================
 */

export const getDocumentById = async ({ user, id } = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const document = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  })
    /*
     * Keep physical filesystem path hidden.
     */
    .select("-fileAbsolutePath")
    .populate("organizationId", "name")
    .populate("owner", "firstName lastName email")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .lean();

  if (!document) {
    throw error("Document not found.", 404);
  }

  return document;
};

/*
 * ==========================================================
 * GET DOCUMENT STORAGE INFO
 * ==========================================================
 *
 * INTERNAL SERVER-SIDE USE ONLY.
 *
 * This method intentionally returns fileAbsolutePath.
 *
 * It is used by:
 *
 * - document viewer
 * - document physical file operations
 *
 * Do NOT expose this method directly through a normal
 * frontend API response.
 * ==========================================================
 */

export const getDocumentStorageInfo = async ({ user, id } = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const document = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  })
    .select(
      [
        "fileSource",
        "fileStorageKey",
        "fileAbsolutePath",
        "fileName",
        "mimeType",
        "fileSize",
        "organizationId",
        "documentNumber",
      ].join(" "),
    )
    .lean();

  if (!document) {
    throw error("Document not found.", 404);
  }

  return document;
};

/*
 * ==========================================================
 * CREATE DOCUMENT
 * ==========================================================
 *
 * Creates a document record without an uploaded file.
 *
 * This supports URL documents and blank documents.
 * ==========================================================
 */

export const createDocument = async ({ user, data = {} } = {}) => {
  const organizationId = getOrgId(user);

  const normalizedPayload = resolveReferences(normalizePayload(data));

  if (!normalizedPayload.documentNumber) {
    throw error("Document number is required.", 400);
  }

  if (!normalizedPayload.title) {
    throw error("Document title is required.", 400);
  }

  if (!normalizedPayload.documentType) {
    throw error("Document type is required.", 400);
  }

  /*
   * Do not allow createDocument() to accidentally create
   * an upload record without a physical file.
   */

  if (normalizedPayload.fileSource === "UPLOAD") {
    throw error(
      "Use the document upload operation when fileSource is UPLOAD.",
      400,
    );
  }

  const existing = await Document.findOne({
    organizationId,
    documentNumber: normalizedPayload.documentNumber,
  })
    .select("_id")
    .lean();

  if (existing) {
    throw error(
      `Document number ${normalizedPayload.documentNumber} already exists.`,
      409,
    );
  }

  const document = await Document.create({
    ...normalizedPayload,

    organizationId,

    fileSource: normalizedPayload.fileSource || "",

    fileName: normalizedPayload.fileName || "",

    fileStorageKey: normalizedPayload.fileStorageKey || "",

    fileAbsolutePath: "",

    fileUrl: normalizedPayload.fileUrl || "",

    fileSize: 0,

    mimeType: normalizedPayload.mimeType || "",

    createdBy: user._id,

    updatedBy: user._id,
  });

  const result = await getDocumentById({
    user,
    id: document._id,
  });

  await auditDocumentAction({
    user,
    action: "CREATE",
    document,
    newData: result,
    description: `Document ${document.documentNumber} created.`,
  });

  return result;
};

/*
 * ==========================================================
 * CREATE UPLOADED DOCUMENT
 * ==========================================================
 *
 * NEW STORAGE STRUCTURE:
 *
 *   <root>/<year>/<month>/<documentNumber>/<documentNumber>.<ext>
 *
 * Example:
 *
 *   public/QMS/documents/2026/09/DOC-001/DOC-001.pdf
 *
 * The storage service automatically determines the current
 * year and month.
 * ==========================================================
 */

export const createUploadedDocument = async ({
  user,
  data = {},
  file,
} = {}) => {
  const organizationId = getOrgId(user);

  if (!file || typeof file.arrayBuffer !== "function") {
    throw error("A document file is required.", 400);
  }

  let normalizedPayload = resolveReferences(normalizePayload(data));

  normalizedPayload.fileSource = "UPLOAD";

  if (!normalizedPayload.documentNumber) {
    throw error("Document number is required.", 400);
  }

  if (!normalizedPayload.title) {
    throw error("Document title is required.", 400);
  }

  if (!normalizedPayload.documentType) {
    throw error("Document type is required.", 400);
  }

  /*
   * Check duplicate document number before writing
   * the physical file.
   */

  const existing = await Document.findOne({
    organizationId,
    documentNumber: normalizedPayload.documentNumber,
  })
    .select("_id")
    .lean();

  if (existing) {
    throw error(
      `Document number ${normalizedPayload.documentNumber} already exists.`,
      409,
    );
  }

  /*
   * ======================================================
   * SAVE PHYSICAL FILE
   * ======================================================
   *
   * The storage service creates:
   *
   *   currentYear/
   *   currentMonth/
   *   documentNumber/
   *
   * and saves:
   *
   *   documentNumber.extension
   *
   * Example:
   *
   *   2026/09/DOC-001/DOC-001.pdf
   */

  const storedFile = await saveUploadedDocument(
    file,
    normalizedPayload.documentNumber,
  );

  let document;

  try {
    document = await Document.create({
      ...normalizedPayload,

      organizationId,

      fileSource: "UPLOAD",

      fileName: storedFile.fileName,

      fileStorageKey: storedFile.fileStorageKey,

      fileAbsolutePath: storedFile.fileAbsolutePath,

      fileUrl: "",

      fileSize: storedFile.fileSize,

      mimeType: storedFile.mimeType,

      createdBy: user._id,

      updatedBy: user._id,
    });
  } catch (dbError) {
    /*
     * MongoDB insert failed after physical file was
     * successfully written.
     *
     * Remove the orphan physical file.
     */

    try {
      await deleteStoredDocument(storedFile.fileAbsolutePath);
    } catch (cleanupError) {
      console.error(
        "Unable to clean up uploaded file after database failure:",
        cleanupError,
      );
    }

    throw dbError;
  }

  const result = await getDocumentById({
    user,
    id: document._id,
  });

  await auditDocumentAction({
    user,
    action: "CREATE",
    document,
    newData: result,
    description: `Document ${document.documentNumber} uploaded and created.`,
  });

  return result;
};

/*
 * ==========================================================
 * UPDATE DOCUMENT
 * ==========================================================
 *
 * Updates metadata only.
 *
 * If fileSource changes from UPLOAD to URL/blank,
 * the existing physical file is removed.
 * ==========================================================
 */

export const updateDocument = async ({ user, id, data = {} } = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const existing = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  });

  if (!existing) {
    throw error("Document not found.", 404);
  }

  const oldData = existing.toObject();

  let normalizedPayload = resolveReferences(normalizePayload(data));

  /*
   * Prevent changing document number through this
   * metadata-only update if the document has a physical
   * upload.
   *
   * A document number is effectively the physical
   * directory/file identity.
   *
   * If changing document number is required later,
   * it should be handled through a dedicated operation
   * that moves the physical file safely.
   */

  if (
    normalizedPayload.documentNumber &&
    normalizedPayload.documentNumber !== existing.documentNumber
  ) {
    throw error(
      "Document number cannot be changed after document creation.",
      400,
    );
  }

  /*
   * If fileSource is not supplied, preserve the existing
   * file source.
   */

  if (normalizedPayload.fileSource === undefined) {
    normalizedPayload.fileSource = existing.fileSource;
  }

  /*
   * If this is an uploaded document and no new file is
   * being supplied, preserve all existing file metadata.
   */

  if (normalizedPayload.fileSource === "UPLOAD") {
    normalizedPayload.fileName = existing.fileName;

    normalizedPayload.fileStorageKey = existing.fileStorageKey;

    normalizedPayload.fileAbsolutePath = existing.fileAbsolutePath;

    normalizedPayload.fileUrl = existing.fileUrl;

    normalizedPayload.fileSize = existing.fileSize;

    normalizedPayload.mimeType = existing.mimeType;
  }

  /*
   * If changing from UPLOAD to URL/blank, remove the
   * existing physical file after the DB update succeeds.
   */

  const oldFileSource = String(existing.fileSource || "").toUpperCase();

  const newFileSource = String(
    normalizedPayload.fileSource || "",
  ).toUpperCase();

  const switchingAwayFromUpload =
    oldFileSource === "UPLOAD" && newFileSource !== "UPLOAD";

  if (switchingAwayFromUpload) {
    normalizedPayload.fileName = "";
    normalizedPayload.fileStorageKey = "";
    normalizedPayload.fileAbsolutePath = "";
    normalizedPayload.fileSize = 0;
    normalizedPayload.mimeType = "";
  }

  Object.assign(existing, {
    ...normalizedPayload,
    updatedBy: user._id,
  });

  await existing.save();

  /*
   * Physical deletion happens only after the DB update
   * succeeds.
   */

  if (switchingAwayFromUpload && oldData.fileAbsolutePath) {
    try {
      await deleteStoredDocument(oldData.fileAbsolutePath);
    } catch (cleanupError) {
      console.error("Unable to delete old document file:", cleanupError);
    }
  }

  const result = await getDocumentById({
    user,
    id: existing._id,
  });

  await auditDocumentAction({
    user,
    action: "UPDATE",
    document: existing,
    oldData,
    newData: result,
    description: `Document ${existing.documentNumber} updated.`,
  });

  return result;
};

/*
 * ==========================================================
 * UPDATE UPLOADED DOCUMENT
 * ==========================================================
 *
 * This is the IMPORTANT replacement operation.
 *
 * Example:
 *
 * Existing file:
 *
 *   2026/09/DOC-001/DOC-001.jpg
 *
 * User replaces file in 2027:
 *
 *   2027/01/DOC-001/DOC-001.pdf
 *
 * The old physical file is deleted only AFTER:
 *
 * 1. New file is successfully written.
 * 2. MongoDB is successfully updated.
 *
 * ==========================================================
 */

export const updateUploadedDocument = async ({
  user,
  id,
  data = {},
  file = null,
} = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const existing = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  });

  if (!existing) {
    throw error("Document not found.", 404);
  }

  const oldData = existing.toObject();

  let normalizedPayload = resolveReferences(normalizePayload(data));

  /*
   * Do not allow changing document number.
   *
   * Physical folder and filename are based on it.
   */

  if (
    normalizedPayload.documentNumber &&
    normalizedPayload.documentNumber !== existing.documentNumber
  ) {
    throw error(
      "Document number cannot be changed after document creation.",
      400,
    );
  }

  /*
   * Always remain an UPLOAD document.
   */

  normalizedPayload.fileSource = "UPLOAD";

  /*
   * If no new file is provided, simply update metadata
   * and preserve the existing physical file.
   */

  if (!file || typeof file.arrayBuffer !== "function") {
    normalizedPayload.fileName = existing.fileName;

    normalizedPayload.fileStorageKey = existing.fileStorageKey;

    normalizedPayload.fileAbsolutePath = existing.fileAbsolutePath;

    normalizedPayload.fileUrl = existing.fileUrl;

    normalizedPayload.fileSize = existing.fileSize;

    normalizedPayload.mimeType = existing.mimeType;

    Object.assign(existing, {
      ...normalizedPayload,
      updatedBy: user._id,
    });

    await existing.save();

    const result = await getDocumentById({
      user,
      id: existing._id,
    });

    await auditDocumentAction({
      user,
      action: "UPDATE",
      document: existing,
      oldData,
      newData: result,
      description: `Document ${existing.documentNumber} metadata updated.`,
    });

    return result;
  }

  /*
   * ======================================================
   * SAVE NEW FILE FIRST
   * ======================================================
   *
   * The storage service automatically uses:
   *
   * current year
   * current month
   * existing document number
   *
   * Example:
   *
   * 2027/01/DOC-001/DOC-001.pdf
   */

  const storedFile = await saveUploadedDocument(file, existing.documentNumber);

  try {
    Object.assign(existing, {
      ...normalizedPayload,

      fileSource: "UPLOAD",

      fileName: storedFile.fileName,

      fileStorageKey: storedFile.fileStorageKey,

      fileAbsolutePath: storedFile.fileAbsolutePath,

      fileUrl: "",

      fileSize: storedFile.fileSize,

      mimeType: storedFile.mimeType,

      updatedBy: user._id,
    });

    /*
     * MongoDB update happens only after the new physical
     * file has been successfully written.
     */

    await existing.save();
  } catch (dbError) {
    /*
     * MongoDB update failed.
     *
     * Delete the newly uploaded file because it is now
     * an orphan file.
     */

    try {
      await deleteStoredDocument(storedFile.fileAbsolutePath);
    } catch (cleanupError) {
      console.error(
        "Unable to clean up new uploaded file after database failure:",
        cleanupError,
      );
    }

    throw dbError;
  }

  /*
   * ======================================================
   * DELETE OLD FILE
   * ======================================================
   *
   * Only after the new file + DB update succeed.
   */

  if (
    oldData.fileAbsolutePath &&
    oldData.fileAbsolutePath !== storedFile.fileAbsolutePath
  ) {
    try {
      await deleteStoredDocument(oldData.fileAbsolutePath);
    } catch (cleanupError) {
      /*
       * Do not fail the successful document update if
       * old-file cleanup fails.
       *
       * The new file is already active.
       */

      console.error("Unable to delete previous document file:", cleanupError);
    }
  }

  const result = await getDocumentById({
    user,
    id: existing._id,
  });

  await auditDocumentAction({
    user,
    action: "UPDATE",
    document: existing,
    oldData,
    newData: result,
    description: `Document ${existing.documentNumber} file replaced.`,
  });

  return result;
};

/*
 * ==========================================================
 * UPDATE DOCUMENT STATUS
 * ==========================================================
 */

export const updateDocumentStatus = async ({
  user,
  id,
  status,
  statusComment = "",
} = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  if (!status) {
    throw error("Document status is required.", 400);
  }

  const normalizedStatus = String(status).trim().toUpperCase();

  const existing = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  });

  if (!existing) {
    throw error("Document not found.", 404);
  }

  const oldData = existing.toObject();

  existing.status = normalizedStatus;

  existing.statusComment = String(statusComment || "").trim();

  existing.updatedBy = user._id;

  await existing.save();

  const result = await getDocumentById({
    user,
    id: existing._id,
  });

  await auditDocumentAction({
    user,
    action: "STATUS_UPDATE",
    document: existing,
    oldData,
    newData: result,
    description: `Document ${existing.documentNumber} status changed to ${normalizedStatus}.`,
  });

  return result;
};

/*
 * ==========================================================
 * DELETE DOCUMENT
 * ==========================================================
 *
 * Database record is removed first.
 *
 * Physical file is deleted afterward.
 *
 * If physical cleanup fails, the database operation remains
 * successful and the error is logged.
 * ==========================================================
 */

export const deleteDocument = async ({ user, id } = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const existing = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  });

  if (!existing) {
    throw error("Document not found.", 404);
  }

  const oldData = existing.toObject();

  /*
   * Remove MongoDB record first.
   */

  await Document.deleteOne({
    _id: existing._id,
  });

  /*
   * Delete physical file afterward.
   */

  if (oldData.fileAbsolutePath) {
    try {
      await deleteStoredDocument(oldData.fileAbsolutePath);
    } catch (cleanupError) {
      console.error("Unable to delete physical document file:", cleanupError);
    }
  }

  await auditDocumentAction({
    user,
    action: "DELETE",
    document: existing,
    oldData,
    newData: null,
    description: `Document ${existing.documentNumber} deleted.`,
  });

  return {
    success: true,
    message: "Document deleted successfully.",
  };
};

/*
 * ==========================================================
 * GET DOCUMENT AUDIT LOGS
 * ==========================================================
 */

export const getDocumentAuditLogs = async ({
  user,
  id,
  page = 1,
  limit = 50,
} = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  if (!user) {
    throw error("Authentication required.", 401);
  }

  /*
   * First verify that the document belongs to the
   * authenticated user's organization.
   *
   * SUPER_ADMIN remains global according to the existing
   * audit architecture.
   */

  const document = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  })
    .select("_id documentNumber organizationId")
    .lean();

  if (!document) {
    throw error("Document not found.", 404);
  }

  /*
   * SUPER_ADMIN:
   *
   * Audit service must receive isSuperAdmin=true.
   *
   * Organization user:
   *
   * Audit service must receive the document's
   * organizationId.
   */

  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const organizationId = isSuperAdmin
    ? null
    : document.organizationId || user.organizationId || null;

  /*
   * Load audit history for this specific document.
   *
   * Audit records created by auditDocumentAction()
   * use:
   *
   *   module: "DOCUMENTS"
   *   recordId: document._id
   */

  const { getAuditLogs } =
    await import("@/services/auditLog/auditLog.service.js");

  const result = await getAuditLogs({
    organizationId,

    isSuperAdmin,

    module: "DOCUMENTS",

    recordId: String(document._id),

    page,
    limit,
  });

  return result;
};

export const getDocumentAuditLogs123 = async ({ user, id } = {}) => {
  if (!id || !validId(id)) {
    throw error("Invalid document ID.", 400);
  }

  const document = await Document.findOne({
    _id: id,
    ...scopeQuery(user),
  })
    .select("_id documentNumber")
    .lean();

  if (!document) {
    throw error("Document not found.", 404);
  }

  /*
   * Audit service may expose its own query method.
   *
   * Keep this function compatible with the existing
   * audit-log implementation.
   */

  try {
    const { getAuditLogs } =
      await import("@/services/auditLog/auditLog.service.js");

    return await getAuditLogs({
      user,
      module: "DOCUMENTS",
      recordId: id,
    });
  } catch (auditError) {
    console.error("Unable to load document audit logs:", auditError);

    return [];
  }
};
