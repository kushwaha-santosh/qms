import mongoose from "mongoose";

import NCR, { NCR_STATUSES } from "@/models/NCR.js";

import User from "@/models/User.js";
import {
  resolveQMSReferences,
  resolveQMSDefaultStatus,
  getQMSStatusWorkflow,
} from "@/services/qms/qmsReference.service.js";

import {
  createAuditLog,
  getRequestMetadata,
  getAuditActorContext,
} from "@/services/auditLog/auditLog.service.js";
import { createNotification } from "@/services/notification/notification.service.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_MODULES,
} from "@/services/notification/notification.constants.js";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const STATUS_TRANSITIONS = {
  OPEN: ["UNDER_REVIEW", "CANCELLED", "CLOSED"],
  UNDER_REVIEW: ["ACTION_IN_PROGRESS", "CANCELLED"],
  ACTION_IN_PROGRESS: ["VERIFICATION", "CANCELLED"],
  VERIFICATION: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ACTION_IN_PROGRESS", "UNDER_REVIEW"],
  CANCELLED: [],
};

// UI-friendly status labels are mapped to the canonical NCR model values.
const normalizeNCRStatus = (value) => {
  const normalized = normalizeUpper(value);
  const aliases = {
    "UNDER INVESTIGATION": "UNDER_REVIEW",
    UNDER_INVESTIGATION: "UNDER_REVIEW",
    "ACTION IN PROGRESS": "ACTION_IN_PROGRESS",
    "PENDING VERIFICATION": "VERIFICATION",
    PENDING_VERIFICATION: "VERIFICATION",
  };
  return aliases[normalized] || normalized;
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const normalizeUpper = (value) => normalizeString(value).toUpperCase();

const isSuperAdmin = (user) => normalizeUpper(user?.role) === "SUPER_ADMIN";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!isValidObjectId(value))
    throw createError("Invalid organization ID.", 400);
  return new mongoose.Types.ObjectId(value);
};

const getUserOrganizationId = (user) => {
  const value = user?.organizationId?._id || user?.organizationId || null;
  return value ? String(value) : null;
};

const resolveOrganizationId = ({ user, requestedOrganizationId = null }) => {
  if (!user) throw createError("Authentication required.", 401);

  if (isSuperAdmin(user)) {
    if (!requestedOrganizationId) {
      throw createError("Organization ID is required for this operation.", 400);
    }
    return String(requestedOrganizationId);
  }

  const ownOrganizationId = getUserOrganizationId(user);
  if (!ownOrganizationId) {
    throw createError("User is not associated with an organization.", 403);
  }

  return ownOrganizationId;
};

const buildTenantQuery = ({ user, organizationId = null } = {}) => {
  if (!user) throw createError("Authentication is required.", 401);

  if (isSuperAdmin(user)) {
    return organizationId ? { organizationId: toObjectId(organizationId) } : {};
  }

  const ownOrganizationId = getUserOrganizationId(user);
  if (!ownOrganizationId) {
    throw createError("Organization information is required.", 403);
  }

  return { organizationId: toObjectId(ownOrganizationId) };
};

const ensureOrganizationExists = async (organizationId) => {
  if (!organizationId || !isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID.", 400);
  }

  const Organization = (await import("@/models/Organization.js")).default;
  const organization = await Organization.findById(organizationId)
    .select("_id name code status")
    .lean();

  if (!organization) throw createError("Organization not found.", 404);
  if (organization.status && organization.status !== "ACTIVE") {
    throw createError("Selected organization is not active.", 400);
  }

  return organization;
};

const verifyOrganizationUser = async ({ userId, organizationId } = {}) => {
  if (!userId) return null;
  if (!isValidObjectId(userId))
    throw createError("Invalid assigned user ID.", 400);

  const user = await User.findOne({
    _id: userId,
    organizationId: toObjectId(organizationId),
    status: "ACTIVE",
  })
    .select("_id firstName lastName email role organizationId status")
    .lean();

  if (!user) {
    throw createError(
      "Selected user does not belong to this organization or is inactive.",
      400,
    );
  }

  return user;
};

const validateNCRInput = async (
  data = {},
  { user = null, organizationId = null } = {},
) => {
  const input = {
    title: normalizeString(data.title),
    description: normalizeString(data.description),
    source: normalizeUpper(data.source),
    severity: normalizeUpper(data.severity),
    category: normalizeUpper(data.category),
    department: normalizeString(data.department),
    location: normalizeString(data.location),
    process: normalizeString(data.process),
    product: normalizeString(data.product),
    batchNumber: normalizeString(data.batchNumber),
    supplier: normalizeString(data.supplier),
    detectedAt: data.detectedAt || null,
    dueDate: data.dueDate || null,
    immediateAction: normalizeString(data.immediateAction),
    containmentAction: normalizeString(data.containmentAction),
    rootCause: normalizeString(data.rootCause),
    correctiveAction: normalizeString(data.correctiveAction),
    preventiveAction: normalizeString(data.preventiveAction),
    verification: normalizeString(data.verification),
    closureComment: normalizeString(data.closureComment),
    assignedTo: data.assignedTo || null,
    capaId: data.capaId || null,
  };

  if (!input.title) throw createError("NCR title is required.", 400);
  if (input.title.length > 250)
    throw createError("NCR title cannot exceed 250 characters.", 400);
  if (!input.description)
    throw createError("NCR description is required.", 400);

  const references = await resolveQMSReferences({
    user,
    organizationId,
    data: input,
    includeStatus: false,
    module: "NCR",
  });

  input.source = references.source;
  input.severity = references.severity;
  input.category = references.category;
  input.department = references.department;
  input.process = references.process;
  input.product = references.product;
  input.location = references.location;
  input.supplier = references.supplier;

  if (input.detectedAt) {
    const date = new Date(input.detectedAt);
    if (Number.isNaN(date.getTime()))
      throw createError("Invalid detected date.", 400);
    input.detectedAt = date;
  } else {
    input.detectedAt = new Date();
  }

  if (input.dueDate) {
    const date = new Date(input.dueDate);
    if (Number.isNaN(date.getTime()))
      throw createError("Invalid due date.", 400);
    input.dueDate = date;
  } else {
    input.dueDate = null;
  }

  if (input.assignedTo && !isValidObjectId(input.assignedTo)) {
    throw createError("Invalid assigned user ID.", 400);
  }

  if (input.capaId && !isValidObjectId(input.capaId)) {
    throw createError("Invalid CAPA ID.", 400);
  }

  return input;
};

const generateNCRNumber = async (organizationId) => {
  const year = new Date().getFullYear();
  const prefix = `NCR-${year}-`;

  const latest = await NCR.findOne({
    organizationId: toObjectId(organizationId),
    ncrNumber: { $regex: `^${prefix}` },
  })
    .sort({ ncrNumber: -1 })
    .select("ncrNumber")
    .lean();

  let nextNumber = 1;
  if (latest?.ncrNumber) {
    const number = Number(latest.ncrNumber.split("-")[2]);
    if (Number.isFinite(number)) nextNumber = number + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
};

const createNCRAuditLog = async ({
  user,
  organizationId,
  action,
  recordId = null,
  description,
  oldData = null,
  newData = null,
  request = null,
}) => {
  try {
    const actor = getAuditActorContext(user);
    const metadata = getRequestMetadata(request);

    return await createAuditLog({
      organizationId: organizationId || actor.organizationId || null,
      userId: actor.userId,
      userName: actor.userName,
      userEmail: actor.userEmail,
      action,
      module: "NCR",
      recordId,
      description,
      oldData,
      newData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  } catch (error) {
    console.error("NCR audit log error:", error);
    return null;
  }
};

const populateNCR = (query) =>
  query
    .populate({ path: "organizationId", select: "name code slug email status" })
    .populate({
      path: "reportedBy",
      select: "firstName lastName email role status",
    })
    .populate({
      path: "assignedTo",
      select: "firstName lastName email role status",
    })
    .populate({
      path: "verifiedBy",
      select: "firstName lastName email role status",
    })
    .populate({
      path: "closedBy",
      select: "firstName lastName email role status",
    })
    .populate({ path: "createdBy", select: "firstName lastName email role" })
    .populate({ path: "updatedBy", select: "firstName lastName email role" });

export const createNCR = async ({
  user,
  organizationId: requestedOrganizationId = null,
  data = {},
  request = null,
} = {}) => {
  if (!user?._id) throw createError("Authentication required.", 401);

  const organizationId = resolveOrganizationId({
    user,
    requestedOrganizationId,
  });

  await ensureOrganizationExists(organizationId);

  const input = await validateNCRInput(data, { user, organizationId });

  if (input.assignedTo) {
    await verifyOrganizationUser({
      userId: input.assignedTo,
      organizationId,
    });
  }

  const ncrNumber = await generateNCRNumber(organizationId);
  const status =
    input.status ||
    (await resolveQMSDefaultStatus({
      user,
      organizationId,
      module: "NCR",
      preferred: "OPEN",
    }));
  const userId = new mongoose.Types.ObjectId(String(user._id));
  const organizationObjectId = toObjectId(organizationId);

  // IMPORTANT: reportedBy is required by the NCR schema and must always
  // come from the authenticated user, never from the browser payload.
  const ncr = await NCR.create({
    organizationId: organizationObjectId,
    ncrNumber,
    title: input.title,
    description: input.description,
    source: input.source,
    severity: input.severity,
    category: input.category,
    department: input.department,
    location: input.location,
    process: input.process,
    product: input.product,
    batchNumber: input.batchNumber,
    supplier: input.supplier,
    detectedAt: input.detectedAt,
    dueDate: input.dueDate,
    immediateAction: input.immediateAction,
    containmentAction: input.containmentAction,
    rootCause: input.rootCause,
    correctiveAction: input.correctiveAction,
    preventiveAction: input.preventiveAction,
    verification: input.verification,
    closureComment: input.closureComment,
    assignedTo: input.assignedTo || null,
    capaId: input.capaId || null,
    status,
    reportedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await createNCRAuditLog({
    user,
    organizationId: organizationObjectId,
    action: "CREATE",
    recordId: ncr._id,
    description: `NCR ${ncr.ncrNumber} created.`,
    newData: ncr.toObject(),
    request,
  });

  return getNCRById({ user, ncrId: ncr._id, organizationId });
};

export const getNCRs = async ({
  user,
  organizationId = null,
  search = "",
  status = "",
  severity = "",
  source = "",
  category = "",
  department = "",
  process = "",
  assignedTo = "",
  reportedBy = "",
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
} = {}) => {
  const query = buildTenantQuery({ user, organizationId });

  if (search?.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$or = [
      { ncrNumber: regex },
      { title: regex },
      { description: regex },
      { department: regex },
      { location: regex },
    ];
  }

  const filters = [
    ["status", status],
    ["severity", severity],
    ["source", source],
    ["category", category],
    ["department", department],
    ["process", process],
  ];

  for (const [field, value] of filters) {
    if (!String(value || "").trim()) continue;
    query[field] = normalizeUpper(value);
  }

  if (assignedTo?.trim()) {
    if (!isValidObjectId(assignedTo))
      throw createError("Invalid assigned user ID.", 400);
    query.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  if (reportedBy?.trim()) {
    if (!isValidObjectId(reportedBy))
      throw createError("Invalid reported user ID.", 400);
    query.reportedBy = new mongoose.Types.ObjectId(reportedBy);
  }

  const currentPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const currentLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const skip = (currentPage - 1) * currentLimit;

  const [ncrs, total] = await Promise.all([
    populateNCR(
      NCR.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit)
        .lean(),
    ),
    NCR.countDocuments(query),
  ]);

  return {
    ncrs,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit) || 1,
    },
  };
};

// Compatibility alias. The API route uses listNCRs; older code uses getNCRs.
export const listNCRs = getNCRs;

export const getNCRById = async ({
  user,
  ncrId,
  organizationId = null,
} = {}) => {
  if (!ncrId || !isValidObjectId(ncrId))
    throw createError("Invalid NCR ID.", 400);

  const tenantQuery = buildTenantQuery({ user, organizationId });
  const ncr = await populateNCR(
    NCR.findOne({
      ...tenantQuery,
      _id: new mongoose.Types.ObjectId(ncrId),
    }).lean(),
  );

  if (!ncr) throw createError("NCR not found.", 404);
  return ncr;
};

export const updateNCR = async ({
  user,
  ncrId,
  data = {},
  organizationId = null,
  request = null,
} = {}) => {
  if (!ncrId || !isValidObjectId(ncrId))
    throw createError("Invalid NCR ID.", 400);

  const tenantQuery = buildTenantQuery({ user, organizationId });
  const query = { ...tenantQuery, _id: new mongoose.Types.ObjectId(ncrId) };
  const existingNCR = await NCR.findOne(query);

  if (!existingNCR) throw createError("NCR not found.", 404);
  const input = await validateNCRInput(
    {
      ...existingNCR.toObject(),
      ...data,
    },
    {
      user,
      organizationId: existingNCR.organizationId,
    },
  );

  const updateFields = {};
  const editableFields = [
    "title",
    "description",
    "source",
    "severity",
    "category",
    "department",
    "location",
    "process",
    "product",
    "batchNumber",
    "supplier",
    "detectedAt",
    "dueDate",
    "immediateAction",
    "containmentAction",
    "rootCause",
    "correctiveAction",
    "preventiveAction",
    "verification",
    "closureComment",
    "capaId",
  ];

  for (const field of editableFields) {
    if (data[field] !== undefined) updateFields[field] = input[field];
  }

  if (data.assignedTo !== undefined) {
    if (data.assignedTo) {
      await verifyOrganizationUser({
        userId: data.assignedTo,
        organizationId: existingNCR.organizationId,
      });
    }
    updateFields.assignedTo = data.assignedTo || null;
  }

  if (Object.keys(updateFields).length === 0) {
    throw createError("No fields were provided for update.", 400);
  }

  updateFields.updatedBy = new mongoose.Types.ObjectId(String(user._id));
  const oldData = existingNCR.toObject();

  const updatedNCR = await NCR.findOneAndUpdate(
    query,
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!updatedNCR) throw createError("NCR could not be updated.", 500);

  await createNCRAuditLog({
    user,
    organizationId: existingNCR.organizationId,
    action: "UPDATE",
    recordId: updatedNCR._id,
    description: `NCR ${updatedNCR.ncrNumber} was updated.`,
    oldData,
    newData: updatedNCR.toObject(),
    request,
  });

  await createNotification({
    userId: updateFields.assignedTo,
    organizationId: existingNCR.organizationId,
    type: NOTIFICATION_TYPES.NCR_ASSIGNED,
    module: NOTIFICATION_MODULES.NCR,
    title: "NCR assigned to you",
    message: `${updatedNCR.ncrNumber || "A new NCR"} has been assigned to you.`,
    recordId: updatedNCR._id,
    recordNumber: updatedNCR.ncrNumber,
    href: `/ncr`,
    priority: "HIGH",
    dedupeKey: `NCR_ASSIGNED:${updatedNCR._id}:${updateFields.assignedTo}`,
  });

  return getNCRById({
    user,
    ncrId: updatedNCR._id,
    organizationId: existingNCR.organizationId,
  });
};

export const updateNCRStatus = async ({
  user,
  ncrId,
  status,
  comment = "",
  organizationId = null,
  request = null,
} = {}) => {
  if (!ncrId || !isValidObjectId(ncrId))
    throw createError("Invalid NCR ID.", 400);

  const tenantQuery = buildTenantQuery({ user, organizationId });
  let newStatus = normalizeNCRStatus(status);
  const statusOptions = await getQMSStatusWorkflow({
    user,
    organizationId: organizationId || user?.organizationId,
    module: "NCR",
  });
  newStatus = statusOptions.aliases?.[newStatus] || newStatus;
  const matchedStatus = statusOptions.statuses.find(
    (item) => item === newStatus,
  );
  if (!matchedStatus)
    throw createError(
      "Invalid NCR status. Please select an active NCR status from Master Data.",
      400,
    );

  const ncr = await NCR.findOne({
    ...tenantQuery,
    _id: new mongoose.Types.ObjectId(ncrId),
  });
  if (!ncr) throw createError("NCR not found.", 404);

  const currentStatus =
    statusOptions.aliases?.[normalizeUpper(ncr.status)] ||
    normalizeUpper(ncr.status);
  if (currentStatus === newStatus)
    throw createError(`NCR is already in ${newStatus} status.`, 400);

  const oldData = {
    status: ncr.status,
    closureComment: ncr.closureComment,
    comment: ncr.closureComment || "",
    verifiedBy: ncr.verifiedBy,
    verifiedAt: ncr.verifiedAt,
    closedBy: ncr.closedBy,
    closedAt: ncr.closedAt,
  };

  ncr.status = newStatus;
  ncr.updatedBy = user._id;
  const statusComment = normalizeString(comment);
  if (statusComment) ncr.closureComment = statusComment;

  if (newStatus === "VERIFICATION") {
    ncr.verifiedBy = null;
    ncr.verifiedAt = null;
  }

  if (newStatus === "CLOSED") {
    ncr.closedBy = user._id;
    ncr.closedAt = new Date();
    ncr.verifiedBy = ncr.verifiedBy || user._id;
    ncr.verifiedAt = ncr.verifiedAt || new Date();
  }

  if (newStatus === "REOPENED") {
    ncr.closedBy = null;
    ncr.closedAt = null;
  }

  await ncr.save();

  await createNCRAuditLog({
    user,
    organizationId: ncr.organizationId,
    action: "STATUS_UPDATE",
    recordId: ncr._id,
    description: `NCR ${ncr.ncrNumber} status changed from ${currentStatus} to ${newStatus}.`,
    oldData,
    newData: {
      status: ncr.status,
      closureComment: ncr.closureComment,
      comment: statusComment,
      verifiedBy: ncr.verifiedBy,
      verifiedAt: ncr.verifiedAt,
      closedBy: ncr.closedBy,
      closedAt: ncr.closedAt,
    },
    request,
  });

  return getNCRById({
    user,
    ncrId: ncr._id,
    organizationId: ncr.organizationId,
  });
};

export const assignNCR = async ({
  user,
  ncrId,
  assignedTo,
  organizationId = null,
  request = null,
} = {}) => {
  if (!ncrId || !isValidObjectId(ncrId))
    throw createError("Invalid NCR ID.", 400);
  if (!assignedTo || !isValidObjectId(assignedTo))
    throw createError("Valid assigned user ID is required.", 400);

  const tenantQuery = buildTenantQuery({ user, organizationId });
  const ncr = await NCR.findOne({
    ...tenantQuery,
    _id: new mongoose.Types.ObjectId(ncrId),
  });
  if (!ncr) throw createError("NCR not found.", 404);
  if (["CANCELLED", "CLOSED"].includes(ncr.status))
    throw createError(
      "This NCR cannot be assigned in its current status.",
      400,
    );

  const assignedUser = await verifyOrganizationUser({
    userId: assignedTo,
    organizationId: ncr.organizationId,
  });

  const oldData = { assignedTo: ncr.assignedTo };
  ncr.assignedTo = assignedUser._id;
  ncr.updatedBy = user._id;
  await ncr.save();

  const name =
    `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim() ||
    assignedUser.email;

  await createNCRAuditLog({
    user,
    organizationId: ncr.organizationId,
    action: "ASSIGN",
    recordId: ncr._id,
    description: `NCR ${ncr.ncrNumber} was assigned to ${name}.`,
    oldData,
    newData: { assignedTo: ncr.assignedTo },
    request,
  });

  return getNCRById({
    user,
    ncrId: ncr._id,
    organizationId: ncr.organizationId,
  });
};

export const deleteNCR = async ({
  user,
  ncrId,
  organizationId = null,
  request = null,
} = {}) => {
  if (!ncrId || !isValidObjectId(ncrId))
    throw createError("Invalid NCR ID.", 400);

  const tenantQuery = buildTenantQuery({ user, organizationId });
  const ncr = await NCR.findOne({
    ...tenantQuery,
    _id: new mongoose.Types.ObjectId(ncrId),
  });
  if (!ncr) throw createError("NCR not found.", 404);
  if (ncr.status === "CLOSED")
    throw createError("Closed NCR cannot be deleted.", 400);

  const oldData = ncr.toObject();
  const result = await NCR.deleteOne({ ...tenantQuery, _id: ncr._id });
  if (result.deletedCount !== 1)
    throw createError("NCR could not be deleted.", 500);

  await createNCRAuditLog({
    user,
    organizationId: ncr.organizationId,
    action: "DELETE",
    recordId: ncr._id,
    description: `NCR ${ncr.ncrNumber} was deleted.`,
    oldData,
    request,
  });

  return { message: `NCR ${ncr.ncrNumber} was deleted successfully.` };
};

export const getNCRStatusWorkflow = async ({
  user,
  organizationId = null,
} = {}) =>
  getQMSStatusWorkflow({
    user,
    organizationId: organizationId || user?.organizationId,
    module: "NCR",
  });
