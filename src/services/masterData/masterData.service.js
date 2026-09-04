import mongoose from "mongoose";

import MasterData, { MASTER_DATA_TYPES } from "@/models/MasterData.js";
import Organization from "@/models/Organization.js";
import { createAuditLog } from "@/services/auditLog/auditLog.service.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeType = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_-]/g, "");

const getOrganizationId = (user) =>
  user?.organizationId?._id || user?.organizationId || null;

const isSuperAdmin = (user) => user?.role === "SUPER_ADMIN";

const normalizeObjectId = (value) => {
  if (!value) return null;

  if (value?._id) {
    return String(value._id);
  }

  return String(value);
};

const validateObjectId = (value, label) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw createError(`Invalid ${label}.`, 400);
  }

  return value;
};

const ensureOrganization = async (organizationId) => {
  validateObjectId(organizationId, "organization ID");

  const organization = await Organization.findById(organizationId)
    .select("_id name status")
    .lean();

  if (!organization) {
    throw createError("Organization not found.", 404);
  }

  return organization;
};

const assertTenantAccess = ({ user, record }) => {
  if (!record) {
    throw createError("Master data not found.", 404);
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  const userOrg = normalizeObjectId(getOrganizationId(user));
  const recordOrg = normalizeObjectId(record.organizationId);

  if (!userOrg || !recordOrg || userOrg !== recordOrg) {
    throw createError("You do not have access to this master data.", 403);
  }

  return true;
};

const cleanMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
};

const auditContext = (user, request) => ({
  userId: user?._id || user?.id || null,

  organizationId: getOrganizationId(user),

  userName:
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.name ||
    user?.fullName ||
    "System",

  userEmail: user?.email || "",

  ipAddress:
    request?.headers?.get?.("x-forwarded-for") ||
    request?.headers?.get?.("x-real-ip") ||
    "",

  userAgent: request?.headers?.get?.("user-agent") || "",
});

const auditMasterData = async ({
  action,
  record,
  oldData = null,
  newData = null,
  description,
  user,
  request,
}) => {
  const audit = auditContext(user, request);

  await createAuditLog({
    organizationId: record?.organizationId || audit.organizationId || null,

    userId: audit.userId,

    userName: audit.userName,

    userEmail: audit.userEmail,

    action,

    module: "MASTER_DATA",

    recordId: record?._id || null,

    description,

    oldData,

    newData,

    ipAddress: audit.ipAddress,

    userAgent: audit.userAgent,
  });
};

const getRecordForAudit = (record) => {
  if (!record) return null;

  const value = record.toObject ? record.toObject() : record;

  return JSON.parse(JSON.stringify(value));
};

/* ==========================================================
 * BUILD TENANT FILTER
 * ========================================================== */

const buildTenantFilter = async ({ user, organizationId = null }) => {
  const superAdmin = isSuperAdmin(user);
  const userOrganizationId = getOrganizationId(user);

  if (superAdmin) {
    if (organizationId) {
      await ensureOrganization(organizationId);

      return {
        $or: [
          {
            organizationId,
          },
          {
            organizationId: null,
            isSystem: true,
          },
        ],
      };
    }

    return {};
  }

  if (!userOrganizationId) {
    throw createError("User is not associated with an organization.", 403);
  }

  return {
    $or: [
      {
        organizationId: userOrganizationId,
      },
      {
        organizationId: null,
        isSystem: true,
      },
    ],
  };
};

/* ==========================================================
 * LIST MASTER DATA - SERVER SIDE PAGINATION
 * ========================================================== */

export async function listMasterData({
  user,
  type,
  organizationId = null,
  includeInactive = false,
  search = "",
  page = 1,
  limit = 10,
}) {
  const normalizedType = normalizeType(type);

  if (!MASTER_DATA_TYPES.includes(normalizedType)) {
    throw createError("Invalid master data type.");
  }

  const tenantFilter = await buildTenantFilter({
    user,
    organizationId,
  });

  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const allowedLimits = [10, 25, 50, 100];

  const requestedLimit = Number.parseInt(limit, 10) || 10;

  const normalizedLimit = allowedLimits.includes(requestedLimit)
    ? requestedLimit
    : 10;

  const query = {
    type: normalizedType,
    ...tenantFilter,
  };

  if (!includeInactive) {
    query.isActive = true;
  }

  const normalizedSearch = String(search || "").trim();

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          {
            code: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            name: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            description: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
        ],
      },
    ];
  }

  const total = await MasterData.countDocuments(query);

  const totalPages = total > 0 ? Math.ceil(total / normalizedLimit) : 0;

  const effectivePage =
    totalPages > 0 ? Math.min(normalizedPage, totalPages) : 1;

  const skip = (effectivePage - 1) * normalizedLimit;

  const data = await MasterData.find(query)
    .populate("organizationId", "name email")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .sort({
      isSystem: -1,
      sortOrder: 1,
      name: 1,
    })
    .skip(skip)
    .limit(normalizedLimit)
    .lean();

  return {
    data,
    pagination: {
      page: effectivePage,
      limit: normalizedLimit,
      total,
      totalPages,
      hasPreviousPage: effectivePage > 1,
      hasNextPage: totalPages > 0 && effectivePage < totalPages,
    },
  };
}

/* ==========================================================
 * GET BY ID
 * ========================================================== */

export async function getMasterDataById({ user, id }) {
  validateObjectId(id, "master data ID");

  const record = await MasterData.findById(id)
    .populate("organizationId", "name email")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .lean();

  assertTenantAccess({
    user,
    record,
  });

  return record;
}

/* ==========================================================
 * CREATE
 * ========================================================== */

export async function createMasterData({ user, data, request }) {
  const type = normalizeType(data?.type);

  if (!MASTER_DATA_TYPES.includes(type)) {
    throw createError("Invalid master data type.");
  }

  const name = String(data?.name || "").trim();

  if (!name) {
    throw createError("Name is required.");
  }

  const code = normalizeCode(data?.code || name);

  if (!code) {
    throw createError("Code is required.");
  }

  const superAdmin = isSuperAdmin(user);
  const userOrganizationId = getOrganizationId(user);

  let targetOrganizationId = null;
  let systemRecord = false;

  if (superAdmin) {
    targetOrganizationId = data?.organizationId || null;

    systemRecord = Boolean(data?.isSystem);

    if (systemRecord) {
      targetOrganizationId = null;
    } else if (targetOrganizationId) {
      await ensureOrganization(targetOrganizationId);
    } else {
      throw createError(
        "Organization is required for organization master data.",
      );
    }
  } else {
    if (!userOrganizationId) {
      throw createError("Organization is required.", 403);
    }

    targetOrganizationId = userOrganizationId;
    systemRecord = false;
  }

  const duplicate = await MasterData.findOne({
    type,
    organizationId: targetOrganizationId,
    code,
  }).lean();

  if (duplicate) {
    throw createError(
      `Master data with code "${code}" already exists for this type.`,
      409,
    );
  }

  const record = await MasterData.create({
    type,
    code,
    name,

    description: String(data?.description || "").trim(),

    organizationId: targetOrganizationId,

    isSystem: systemRecord,

    isActive: data?.isActive !== false,

    sortOrder: Number.isFinite(Number(data?.sortOrder))
      ? Number(data.sortOrder)
      : 0,

    metadata: cleanMetadata(data?.metadata),

    createdBy: user?._id || null,

    updatedBy: user?._id || null,
  });

  const newData = getRecordForAudit(record);

  await auditMasterData({
    action: "CREATE",
    record,
    oldData: null,
    newData,
    description: `${type} ${name} created.`,
    user,
    request,
  });

  return getMasterDataById({
    user,
    id: record._id,
  });
}

/* ==========================================================
 * UPDATE
 * ========================================================== */

export async function updateMasterData({ user, id, data, request }) {
  validateObjectId(id, "master data ID");

  const record = await MasterData.findById(id);

  assertTenantAccess({
    user,
    record,
  });

  if (record.isSystem && !isSuperAdmin(user)) {
    throw createError(
      "System master data can only be changed by Super Admin.",
      403,
    );
  }

  const oldData = getRecordForAudit(record);

  if (data?.type !== undefined && normalizeType(data.type) !== record.type) {
    throw createError("Master data type cannot be changed.", 400);
  }

  if (data?.organizationId !== undefined) {
    if (!isSuperAdmin(user)) {
      throw createError(
        "Organization cannot be changed by organization users.",
        403,
      );
    }

    if (record.isSystem && data.organizationId) {
      throw createError(
        "System master data cannot be assigned to an organization.",
        400,
      );
    }

    if (data.organizationId) {
      await ensureOrganization(data.organizationId);
    }

    record.organizationId = data.organizationId || null;

    record.isSystem =
      !data.organizationId && Boolean(data?.isSystem ?? record.isSystem);
  }

  if (data?.isSystem !== undefined) {
    if (!isSuperAdmin(user)) {
      throw createError("Only Super Admin can change system master data.", 403);
    }

    record.isSystem = Boolean(data.isSystem);

    if (record.isSystem) {
      record.organizationId = null;
    }
  }

  if (data?.name !== undefined) {
    const name = String(data.name).trim();

    if (!name) {
      throw createError("Name is required.");
    }

    record.name = name;
  }

  if (data?.code !== undefined) {
    const code = normalizeCode(data.code);

    if (!code) {
      throw createError("Code is required.");
    }

    record.code = code;
  }

  if (data?.description !== undefined) {
    record.description = String(data.description || "").trim();
  }

  if (data?.isActive !== undefined) {
    record.isActive = Boolean(data.isActive);
  }

  if (data?.sortOrder !== undefined) {
    record.sortOrder = Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : 0;
  }

  if (data?.metadata !== undefined) {
    record.metadata = cleanMetadata(data.metadata);
  }

  record.updatedBy = user?._id || null;

  const duplicate = await MasterData.findOne({
    _id: {
      $ne: record._id,
    },

    type: record.type,

    organizationId: record.organizationId,

    code: record.code,
  }).lean();

  if (duplicate) {
    throw createError(
      `Master data with code "${record.code}" already exists for this type.`,
      409,
    );
  }

  await record.save();

  const newData = getRecordForAudit(record);

  await auditMasterData({
    action: "UPDATE",
    record,
    oldData,
    newData,
    description: `${record.type} ${record.name} updated.`,
    user,
    request,
  });

  return getMasterDataById({
    user,
    id: record._id,
  });
}

/* ==========================================================
 * STATUS
 * ========================================================== */

export async function updateMasterDataStatus({ user, id, isActive, request }) {
  validateObjectId(id, "master data ID");

  const record = await MasterData.findById(id);

  assertTenantAccess({
    user,
    record,
  });

  if (record.isSystem && !isSuperAdmin(user)) {
    throw createError(
      "System master data can only be changed by Super Admin.",
      403,
    );
  }

  const oldData = getRecordForAudit(record);

  record.isActive = Boolean(isActive);
  record.updatedBy = user?._id || null;

  await record.save();

  const newData = getRecordForAudit(record);

  await auditMasterData({
    action: "STATUS_UPDATE",
    record,
    oldData,
    newData,
    description: `${record.type} ${record.name} status changed to ${
      record.isActive ? "ACTIVE" : "INACTIVE"
    }.`,
    user,
    request,
  });

  return getMasterDataById({
    user,
    id: record._id,
  });
}

/* ==========================================================
 * DELETE
 * ========================================================== */

export async function deleteMasterData({ user, id, request }) {
  validateObjectId(id, "master data ID");

  const record = await MasterData.findById(id);

  assertTenantAccess({
    user,
    record,
  });

  if (record.isSystem && !isSuperAdmin(user)) {
    throw createError(
      "System master data can only be deleted by Super Admin.",
      403,
    );
  }

  const oldData = getRecordForAudit(record);

  await MasterData.deleteOne({
    _id: record._id,
  });

  await auditMasterData({
    action: "DELETE",
    record,
    oldData,
    newData: null,
    description: `${record.type} ${record.name} deleted.`,
    user,
    request,
  });

  return true;
}
