import mongoose from "mongoose";

import Location, { LOCATION_TYPES } from "@/models/Location.js";

import { createAuditLog } from "@/services/auditLog/auditLog.service.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (value?._id) {
    return String(value._id);
  }

  return String(value);
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateId = (value, label) => {
  if (!value || !isValidObjectId(value)) {
    throw createError(`Invalid ${label}.`, 400);
  }

  return value;
};

const normalizeType = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeName = (value) => String(value || "").trim();

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_-]/g, "");

const normalizePincode = (value) => String(value || "").trim();

const isSuperAdmin = (user) => user?.role === "SUPER_ADMIN";

const getOrganizationId = (user) =>
  user?.organizationId?._id || user?.organizationId || null;

/*
 * ============================================================
 * TYPE HIERARCHY
 * ============================================================
 */

const PARENT_TYPES = {
  COUNTRY: null,
  STATE: "COUNTRY",
  DISTRICT: "STATE",
  CITY: "DISTRICT",
  PINCODE: "CITY",
};

const validateType = (type) => {
  const normalizedType = normalizeType(type);

  if (!LOCATION_TYPES.includes(normalizedType)) {
    throw createError("Invalid location type.", 400);
  }

  return normalizedType;
};

/*
 * ============================================================
 * AUDIT CONTEXT
 * ============================================================
 */

const getAuditContext = (user, request) => ({
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

/*
 * ============================================================
 * AUDIT
 * ============================================================
 */

const writeAuditLog = async ({
  action,
  record,
  oldData = null,
  newData = null,
  description,
  user,
  request,
}) => {
  const context = getAuditContext(user, request);

  await createAuditLog({
    organizationId: context.organizationId,

    userId: context.userId,

    userName: context.userName,

    userEmail: context.userEmail,

    action,

    module: "LOCATION_MASTER",

    recordId: record?._id || null,

    description,

    oldData,

    newData,

    ipAddress: context.ipAddress,

    userAgent: context.userAgent,
  });
};

/*
 * ============================================================
 * SNAPSHOT
 * ============================================================
 */

const snapshot = (record) => {
  if (!record) {
    return null;
  }

  const value = record.toObject ? record.toObject() : record;

  return JSON.parse(JSON.stringify(value));
};

/*
 * ============================================================
 * PARENT VALIDATION
 * ============================================================
 */

const getAndValidateParent = async ({ type, parentId }) => {
  const expectedParentType = PARENT_TYPES[type];

  if (!expectedParentType) {
    if (parentId) {
      throw createError("Country cannot have a parent location.", 400);
    }

    return null;
  }

  if (!parentId) {
    throw createError(
      `${expectedParentType} is required as the parent location.`,
      400,
    );
  }

  validateId(parentId, "parent location ID");

  const parent = await Location.findById(parentId);

  if (!parent) {
    throw createError("Parent location not found.", 404);
  }

  if (parent.type !== expectedParentType) {
    throw createError(`${type} must belong to a ${expectedParentType}.`, 400);
  }

  return parent;
};

/*
 * ============================================================
 * BUILD HIERARCHY IDS
 * ============================================================
 */

const buildHierarchy = ({ type, parent }) => {
  const result = {
    countryId: null,
    stateId: null,
    districtId: null,
    cityId: null,
  };

  if (type === "COUNTRY") {
    return result;
  }

  if (type === "STATE") {
    result.countryId = parent._id;

    return result;
  }

  if (type === "DISTRICT") {
    result.countryId = parent.countryId;

    result.stateId = parent._id;

    return result;
  }

  if (type === "CITY") {
    result.countryId = parent.countryId;

    result.stateId = parent.stateId;

    result.districtId = parent._id;

    return result;
  }

  if (type === "PINCODE") {
    result.countryId = parent.countryId;

    result.stateId = parent.stateId;

    result.districtId = parent.districtId;

    result.cityId = parent._id;

    return result;
  }

  return result;
};

/*
 * ============================================================
 * LIST LOCATIONS
 * ============================================================
 */

export const listLocations = async ({
  user,
  type,
  parentId = null,
  search = "",
  isActive = "",
  page = 1,
  limit = 20,
} = {}) => {
  const normalizedType = validateType(type);

  const currentPage = Math.max(Number(page) || 1, 1);

  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const query = {
    type: normalizedType,
  };

  /*
   * --------------------------------------------------------
   * PARENT
   * --------------------------------------------------------
   */

  if (parentId) {
    validateId(parentId, "parent location ID");

    query.parentId = parentId;
  }

  /*
   * --------------------------------------------------------
   * STATUS
   * --------------------------------------------------------
   */

  if (isActive !== "" && isActive !== null && isActive !== undefined) {
    if (isActive === true || isActive === "true") {
      query.isActive = true;
    }

    if (isActive === false || isActive === "false") {
      query.isActive = false;
    }
  }

  /*
   * --------------------------------------------------------
   * SEARCH
   * --------------------------------------------------------
   */

  const trimmedSearch = String(search || "").trim();

  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        code: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        pincode: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  /*
   * --------------------------------------------------------
   * TOTAL
   * --------------------------------------------------------
   */

  const total = await Location.countDocuments(query);

  const totalPages = Math.ceil(total / pageSize);

  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const skip = (safePage - 1) * pageSize;

  /*
   * --------------------------------------------------------
   * DATA
   * --------------------------------------------------------
   */

  const locations = await Location.find(query)
    .populate("parentId", "_id name type code")
    .populate("countryId", "_id name code")
    .populate("stateId", "_id name code")
    .populate("districtId", "_id name code")
    .populate("cityId", "_id name code")
    .populate("createdBy", "_id firstName lastName email")
    .populate("updatedBy", "_id firstName lastName email")
    .sort({
      name: 1,
      _id: 1,
    })
    .skip(skip)
    .limit(pageSize)
    .lean();

  return {
    locations,

    pagination: {
      page: safePage,
      limit: pageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
};

/*
 * ============================================================
 * GET LOCATION
 * ============================================================
 */

export const getLocationById = async ({ user, id }) => {
  validateId(id, "location ID");

  const location = await Location.findById(id)
    .populate("parentId", "_id name type code")
    .populate("countryId", "_id name code")
    .populate("stateId", "_id name code")
    .populate("districtId", "_id name code")
    .populate("cityId", "_id name code")
    .populate("createdBy", "_id firstName lastName email")
    .populate("updatedBy", "_id firstName lastName email")
    .lean();

  if (!location) {
    throw createError("Location not found.", 404);
  }

  return location;
};

/*
 * ============================================================
 * CREATE
 * ============================================================
 */

export const createLocation = async ({ user, data, request }) => {
  const type = validateType(data?.type);

  const name = normalizeName(data?.name);

  if (!name) {
    throw createError("Location name is required.");
  }

  /*
   * PINCODE VALIDATION
   */

  let pincode = null;

  if (type === "PINCODE") {
    pincode = normalizePincode(data?.pincode || data?.name);

    if (!/^\d{6}$/.test(pincode)) {
      throw createError("Indian pincode must contain exactly 6 digits.", 400);
    }
  }

  const parent = await getAndValidateParent({
    type,
    parentId: data?.parentId || null,
  });

  /*
   * HIERARCHY
   */

  const hierarchy = buildHierarchy({
    type,
    parent,
  });

  /*
   * CODE
   */

  let code = normalizeCode(data?.code);

  if (!code) {
    if (type === "PINCODE") {
      code = pincode;
    } else {
      code = normalizeCode(name);
    }
  }

  /*
   * DUPLICATE
   */

  const duplicateQuery = {
    type,
    parentId: parent?._id || null,
    name,
  };

  const duplicate = await Location.findOne(duplicateQuery).lean();

  if (duplicate) {
    throw createError(
      `${type} "${name}" already exists under this parent location.`,
      409,
    );
  }

  /*
   * CREATE
   */

  const location = await Location.create({
    type,

    name,

    code,

    parentId: parent?._id || null,

    ...hierarchy,

    pincode,

    isActive: data?.isActive !== false,

    createdBy: user?._id || null,

    updatedBy: user?._id || null,
  });

  const newData = snapshot(location);

  await writeAuditLog({
    action: "CREATE",

    record: location,

    oldData: null,

    newData,

    description: `${type} "${name}" created.`,

    user,

    request,
  });

  return getLocationById({
    user,
    id: location._id,
  });
};

/*
 * ============================================================
 * UPDATE
 * ============================================================
 */

export const updateLocation = async ({ user, id, data, request }) => {
  validateId(id, "location ID");

  const location = await Location.findById(id);

  if (!location) {
    throw createError("Location not found.", 404);
  }

  const oldData = snapshot(location);

  /*
   * --------------------------------------------------------
   * TYPE CANNOT CHANGE
   * --------------------------------------------------------
   */

  if (data?.type !== undefined && validateType(data.type) !== location.type) {
    throw createError("Location type cannot be changed.", 400);
  }

  /*
   * --------------------------------------------------------
   * PARENT CANNOT CHANGE
   *
   * Changing parent would invalidate the complete
   * denormalized hierarchy.
   *
   * Delete + recreate is safer for administrative master data.
   * --------------------------------------------------------
   */

  if (
    data?.parentId !== undefined &&
    normalizeId(data.parentId) !== normalizeId(location.parentId)
  ) {
    throw createError(
      "Parent location cannot be changed. Create the location under the correct parent instead.",
      400,
    );
  }

  /*
   * NAME
   */

  if (data?.name !== undefined) {
    const name = normalizeName(data.name);

    if (!name) {
      throw createError("Location name is required.");
    }

    location.name = name;
  }

  /*
   * CODE
   */

  if (data?.code !== undefined) {
    const code = normalizeCode(data.code);

    if (!code) {
      throw createError("Location code is required.");
    }

    location.code = code;
  }

  /*
   * PINCODE
   */

  if (location.type === "PINCODE" && data?.pincode !== undefined) {
    const pincode = normalizePincode(data.pincode);

    if (!/^\d{6}$/.test(pincode)) {
      throw createError("Indian pincode must contain exactly 6 digits.", 400);
    }

    location.pincode = pincode;
  }

  /*
   * STATUS
   */

  if (data?.isActive !== undefined) {
    location.isActive = Boolean(data.isActive);
  }

  /*
   * DUPLICATE
   */

  const duplicate = await Location.findOne({
    _id: {
      $ne: location._id,
    },

    type: location.type,

    parentId: location.parentId,

    name: location.name,
  }).lean();

  if (duplicate) {
    throw createError(
      `${location.type} "${location.name}" already exists under this parent location.`,
      409,
    );
  }

  location.updatedBy = user?._id || null;

  await location.save();

  const newData = snapshot(location);

  await writeAuditLog({
    action: "UPDATE",

    record: location,

    oldData,

    newData,

    description: `${location.type} "${location.name}" updated.`,

    user,

    request,
  });

  return getLocationById({
    user,
    id: location._id,
  });
};

/*
 * ============================================================
 * STATUS UPDATE
 * ============================================================
 */

export const updateLocationStatus = async ({ user, id, isActive, request }) => {
  validateId(id, "location ID");

  const location = await Location.findById(id);

  if (!location) {
    throw createError("Location not found.", 404);
  }

  const oldData = snapshot(location);

  location.isActive = Boolean(isActive);

  location.updatedBy = user?._id || null;

  await location.save();

  const newData = snapshot(location);

  await writeAuditLog({
    action: "STATUS_UPDATE",

    record: location,

    oldData,

    newData,

    description: `${location.type} "${location.name}" status changed to ${
      location.isActive ? "ACTIVE" : "INACTIVE"
    }.`,
    user,
    request,
  });

  return getLocationById({
    user,
    id: location._id,
  });
};

/*
 * ============================================================
 * DELETE
 * ============================================================
 */

export const deleteLocation = async ({ user, id, request }) => {
  validateId(id, "location ID");

  const location = await Location.findById(id);

  if (!location) {
    throw createError("Location not found.", 404);
  }

  /*
   * Never allow deletion when children exist.
   */

  const child = await Location.exists({
    parentId: location._id,
  });

  if (child) {
    throw createError(
      "This location cannot be deleted because child locations exist. Delete or deactivate the child locations first.",
      409,
    );
  }

  const oldData = snapshot(location);

  await Location.deleteOne({
    _id: location._id,
  });

  await writeAuditLog({
    action: "DELETE",

    record: location,

    oldData,

    newData: null,

    description: `${location.type} "${location.name}" deleted.`,

    user,

    request,
  });

  return true;
};
