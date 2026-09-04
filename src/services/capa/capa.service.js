import mongoose from "mongoose";
import CAPA from "@/models/CAPA.js";
import User from "@/models/User.js";
import Organization from "@/models/Organization.js";
import {
  resolveQMSReferences,
  resolveQMSDefaultStatus,
  getQMSStatusWorkflow,
} from "@/services/qms/qmsReference.service.js";
import { createAuditLogFromUser } from "@/services/auditLog/auditLog.service.js";
import { createNotification } from "@/services/notification/notification.service.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_MODULES,
} from "@/services/notification/notification.constants.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeString = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "object" && value._id) return toObjectId(value._id);
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value))
    return new mongoose.Types.ObjectId(value);
  return null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStatus = (value) => normalizeString(value).toUpperCase();

const getOrganizationId = (user) =>
  user?.organizationId?._id || user?.organizationId || null;

const ensureOrganizationExists = async (organizationId) => {
  const id = toObjectId(organizationId);
  if (!id) throw createError("Valid organization ID is required.", 400);

  const organization = await Organization.findById(id)
    .select("_id name email status plan")
    .lean();
  if (!organization) throw createError("Organization not found.", 404);
  if (
    organization.status &&
    String(organization.status).toUpperCase() !== "ACTIVE"
  ) {
    throw createError("Organization is not active.", 400);
  }
  return organization;
};

const buildTenantQuery = ({
  organizationId = null,
  isSuperAdmin = false,
  targetOrganizationId = null,
} = {}) => {
  if (isSuperAdmin) {
    if (!targetOrganizationId) return {};
    const targetId = toObjectId(targetOrganizationId);
    if (!targetId) throw createError("Invalid target organization ID.", 400);
    return { organizationId: targetId };
  }

  const normalizedOrganizationId = toObjectId(organizationId);
  if (!normalizedOrganizationId)
    throw createError("Valid organization information is required.", 400);
  return { organizationId: normalizedOrganizationId };
};

const buildCAPAIdentifierQuery = (id) => {
  const value = normalizeString(id);
  if (!value) throw createError("CAPA ID is required.", 400);
  return mongoose.Types.ObjectId.isValid(value)
    ? { _id: new mongoose.Types.ObjectId(value) }
    : { capaNumber: value };
};

const generateCAPANumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CAPA-${year}-`;
  const lastCAPA = await CAPA.findOne({ capaNumber: { $regex: `^${prefix}` } })
    .sort({ capaNumber: -1 })
    .select("capaNumber")
    .lean();
  let sequence = 1;
  if (lastCAPA?.capaNumber) {
    const lastSequence = Number(lastCAPA.capaNumber.split("-")[2]);
    if (!Number.isNaN(lastSequence)) sequence = lastSequence + 1;
  }
  return prefix + String(sequence).padStart(5, "0");
};

const getUserDisplayName = (user) => {
  if (!user) return "";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.name || user.fullName || user.email || "";
};

const populateCAPA = (query) =>
  query
    .populate({
      path: "assignedTo",
      select: "firstName lastName name fullName email role status",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName name fullName email role status",
    })
    .populate({
      path: "updatedBy",
      select: "firstName lastName name fullName email role status",
    })
    .populate({ path: "organizationId", select: "_id name email status plan" });

export const getCAPAs = async ({
  organizationId = null,
  isSuperAdmin = false,
  search = "",
  status = "",
  severity = "",
  assignedTo = "",
  category = "",
  source = "",
  department = "",
  process = "",
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
} = {}) => {
  const query = buildTenantQuery({
    organizationId,
    isSuperAdmin,
    targetOrganizationId: organizationId,
  });

  if (normalizeString(search)) {
    const escapedSearch = normalizeString(search).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const regex = new RegExp(escapedSearch, "i");
    query.$or = [
      { capaNumber: regex },
      { title: regex },
      { description: regex },
      { ncrNumber: regex },
      { assignedToName: regex },
    ];
  }
  if (normalizeString(status)) query.status = normalizeStatus(status);
  if (normalizeString(severity))
    query.severity = normalizeString(severity).toUpperCase();
  if (normalizeString(category)) query.category = normalizeString(category);
  if (normalizeString(source)) query.source = normalizeString(source);
  if (normalizeString(department))
    query.department = normalizeString(department);
  if (normalizeString(process)) query.process = normalizeString(process);
  if (
    normalizeString(assignedTo) &&
    mongoose.Types.ObjectId.isValid(assignedTo)
  )
    query.assignedTo = new mongoose.Types.ObjectId(assignedTo);

  const currentPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const currentLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const skip = (currentPage - 1) * currentLimit;

  const [capas, total] = await Promise.all([
    populateCAPA(CAPA.find(query))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .lean(),
    CAPA.countDocuments(query),
  ]);

  return {
    capas,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit) || 1,
    },
  };
};

export const getCAPAById = async ({
  id,
  organizationId = null,
  isSuperAdmin = false,
} = {}) => {
  const query = {
    ...buildTenantQuery({
      organizationId,
      isSuperAdmin,
      targetOrganizationId: organizationId,
    }),
    ...buildCAPAIdentifierQuery(id),
  };
  const capa = await populateCAPA(CAPA.findOne(query)).lean();
  if (!capa) throw createError("CAPA not found.", 404);
  return capa;
};

export const createCAPA = async ({ data = {}, user, request = null } = {}) => {
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const requestedOrganizationId = data.organizationId || null;
  const organizationId = isSuperAdmin
    ? requestedOrganizationId
    : getOrganizationId(user);

  if (!toObjectId(organizationId))
    throw createError("Organization information is required.", 400);
  await ensureOrganizationExists(organizationId);

  if (isSuperAdmin) {
    const organization = await Organization.findById(organizationId)
      .select("_id name status")
      .lean();
    if (!organization)
      throw createError("Selected organization not found.", 404);
    if (organization.status && organization.status !== "ACTIVE")
      throw createError("Selected organization is not active.", 400);
  }

  const title = normalizeString(data.title);
  if (!title) throw createError("CAPA title is required.", 400);

  const capaNumber = await generateCAPANumber();
  let assignedTo = null;
  let assignedToName = "";

  if (data.assignedTo) {
    const assignedUser = await User.findOne({
      _id: data.assignedTo,
      organizationId: toObjectId(organizationId),
    })
      .select("firstName lastName name fullName email role status")
      .lean();
    if (!assignedUser)
      throw createError(
        "Assigned user not found in the selected organization.",
        404,
      );
    assignedTo = assignedUser._id;
    assignedToName = getUserDisplayName(assignedUser);
  }

  let normalizedStatus =
    normalizeStatus(data.status) ||
    (await resolveQMSDefaultStatus({
      user,
      organizationId,
      module: "CAPA",
      preferred: "OPEN",
    }));
  const statusWorkflow = await getQMSStatusWorkflow({
    user,
    organizationId,
    module: "CAPA",
  });
  normalizedStatus =
    statusWorkflow.aliases?.[normalizedStatus] || normalizedStatus;
  if (!statusWorkflow.statuses.includes(normalizedStatus))
    throw createError(
      "Invalid CAPA status. Please select an active CAPA status from Master Data.",
      400,
    );

  const references = await resolveQMSReferences({
    user,
    organizationId,
    data: {
      ...data,
      status: normalizedStatus,
    },
    includeStatus: true,
    module: "CAPA",
  });

  const capa = await CAPA.create({
    organizationId: toObjectId(organizationId),
    capaNumber,
    ncrId: data.ncrId || null,
    ncrNumber: normalizeString(data.ncrNumber),
    title,
    description: normalizeString(data.description),
    category: references.category,
    source: references.source,
    severity: references.severity || "MEDIUM",
    status: normalizedStatus,
    department: references.department,
    process: references.process,
    product: references.product,
    location: references.location,
    rootCauseCategory: references.rootCauseCategory,
    dueDate: normalizeDate(data.dueDate),
    assignedTo,
    assignedToName,
    rootCause: normalizeString(data.rootCause),
    immediateAction: normalizeString(data.immediateAction),
    correctiveAction: normalizeString(data.correctiveAction),
    preventiveAction: normalizeString(data.preventiveAction),
    createdBy: user?._id || null,
    updatedBy: user?._id || null,
  });

  await createAuditLogFromUser({
    user,
    action: "CREATE",
    module: "CAPA",
    recordId: capa._id,
    description: `Created CAPA ${capa.capaNumber}`,
    oldData: null,
    newData: capa,
    request,
  });

  return getCAPAById({ id: capa._id, organizationId, isSuperAdmin: false });
};

export const updateCAPA = async ({
  id,
  data = {},
  user,
  request = null,
} = {}) => {
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const existing = await getCAPAById({
    id,
    organizationId: user?.organizationId,
    isSuperAdmin,
  });
  const oldData = existing;
  const update = {};

  const fields = [
    "title",
    "description",
    "category",
    "source",
    "severity",
    "department",
    "process",
    "product",
    "location",
    "rootCauseCategory",
    "rootCause",
    "immediateAction",
    "correctiveAction",
    "preventiveAction",
    "ncrNumber",
  ];
  for (const field of fields)
    if (data[field] !== undefined)
      update[field] =
        field === "severity"
          ? normalizeString(data[field]).toUpperCase()
          : normalizeString(data[field]);
  if (data.dueDate !== undefined) update.dueDate = normalizeDate(data.dueDate);

  const capaOrganizationId =
    existing.organizationId?._id || existing.organizationId;
  if (data.assignedTo !== undefined) {
    if (!data.assignedTo) {
      update.assignedTo = null;
      update.assignedToName = "";
    } else {
      const assignedUser = await User.findOne({
        _id: data.assignedTo,
        organizationId: toObjectId(capaOrganizationId),
      })
        .select("firstName lastName name fullName email role status")
        .lean();
      if (!assignedUser)
        throw createError(
          "Assigned user not found in the CAPA organization.",
          404,
        );
      update.assignedTo = assignedUser._id;
      update.assignedToName = getUserDisplayName(assignedUser);
    }
  }

  const references = await resolveQMSReferences({
    user,
    organizationId: capaOrganizationId,
    data: {
      ...existing,
      ...data,
    },
    includeStatus: false,
    module: "CAPA",
  });

  update.category = references.category;
  update.source = references.source;
  update.severity = references.severity || existing.severity || "MEDIUM";
  update.department = references.department;
  update.process = references.process;
  update.product = references.product;
  update.location = references.location;
  update.rootCauseCategory = references.rootCauseCategory;

  if (data.status !== undefined) {
    let normalizedStatus = normalizeStatus(data.status);
    const workflow = await getQMSStatusWorkflow({
      user,
      organizationId: capaOrganizationId,
      module: "CAPA",
    });
    normalizedStatus = workflow.aliases?.[normalizedStatus] || normalizedStatus;
    const currentStatus =
      workflow.aliases?.[normalizeStatus(existing.status)] ||
      normalizeStatus(existing.status);

    // Do not revalidate an unchanged legacy status while editing other fields.
    // A real status change must always use an active DB master status and an allowed transition.
    if (currentStatus !== normalizedStatus) {
      if (!workflow.statuses.includes(normalizedStatus))
        throw createError(
          "Invalid CAPA status. Please select an active CAPA status from Master Data.",
          400,
        );
      update.status = normalizedStatus;
    }
  }

  update.updatedBy = user?._id || null;

  const updated = await populateCAPA(
    CAPA.findOneAndUpdate(
      {
        ...buildTenantQuery({
          organizationId: capaOrganizationId,
          isSuperAdmin,
        }),
        ...buildCAPAIdentifierQuery(id),
      },
      { $set: update },
      { new: true, runValidators: true },
    ),
  ).lean();
  if (!updated) throw createError("CAPA not found.", 404);

  await createAuditLogFromUser({
    user,
    action: "UPDATE",
    module: "CAPA",
    recordId: updated._id,
    description: `Updated CAPA ${updated.capaNumber}`,
    oldData,
    newData: updated,
    request,
  });
  return updated;
};

export const updateCAPAStatus = async ({
  id,
  status,
  comments = "",
  user,
  request = null,
} = {}) => {
  if (!id) throw createError("CAPA ID is required.", 400);
  let normalizedStatus = normalizeStatus(status);
  const capa = await getCAPAById({
    id,
    organizationId: user?.organizationId,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  });
  const capaOrganizationId = capa.organizationId?._id || capa.organizationId;
  const workflow = await getQMSStatusWorkflow({
    user,
    organizationId: capaOrganizationId,
    module: "CAPA",
  });
  normalizedStatus = workflow.aliases?.[normalizedStatus] || normalizedStatus;
  if (!workflow.statuses.includes(normalizedStatus))
    throw createError(
      "Invalid CAPA status. Please select an active CAPA status from Master Data.",
      400,
    );
  const currentStatus =
    workflow.aliases?.[normalizeStatus(capa.status)] ||
    normalizeStatus(capa.status);
  if (currentStatus === normalizedStatus)
    throw createError(`CAPA is already in ${normalizedStatus} status.`, 400);
  const oldData = capa;
  const update = {
    status: normalizedStatus,
    comments: normalizeString(comments),
    updatedBy: user?._id || null,
  };

  const updated = await populateCAPA(
    CAPA.findOneAndUpdate(
      {
        ...buildTenantQuery({
          organizationId: capaOrganizationId,
          isSuperAdmin: user?.role === "SUPER_ADMIN",
        }),
        _id: capa._id,
      },
      { $set: update },
      { new: true, runValidators: true },
    ),
  ).lean();
  await createAuditLogFromUser({
    user,
    action: "STATUS_CHANGE",
    module: "CAPA",
    recordId: updated._id,
    description: `CAPA ${updated.capaNumber} status changed from ${oldData.status} to ${updated.status}`,
    oldData,
    newData: updated,
    request,
  });
  return updated;
};

export const assignCAPA = async ({
  id,
  assignedTo,
  user,
  request = null,
} = {}) => {
  if (!assignedTo) throw createError("Assigned user is required.", 400);
  const capa = await getCAPAById({
    id,
    organizationId: user?.organizationId,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  });
  const capaOrganizationId = capa.organizationId?._id || capa.organizationId;
  const assignedUser = await User.findOne({
    _id: assignedTo,
    organizationId: toObjectId(capaOrganizationId),
  })
    .select("firstName lastName name fullName email role status")
    .lean();
  if (!assignedUser)
    throw createError("Assigned user not found in the CAPA organization.", 404);

  const oldData = capa;
  const assignedToName = getUserDisplayName(assignedUser);
  const updated = await populateCAPA(
    CAPA.findByIdAndUpdate(
      capa._id,
      {
        $set: {
          assignedTo: assignedUser._id,
          assignedToName,
          updatedBy: user?._id || null,
        },
      },
      { new: true, runValidators: true },
    ),
  ).lean();

  await createAuditLogFromUser({
    user,
    action: "ASSIGN",
    module: "CAPA",
    recordId: updated._id,
    description: `Assigned CAPA ${updated.capaNumber} to ${assignedToName}`,
    oldData,
    newData: updated,
    request,
  });

  await createNotification({
    userId: assignedUser._id,
    organizationId: capaOrganizationId,
    type: NOTIFICATION_TYPES.CAPA_ASSIGNED,
    module: NOTIFICATION_MODULES.CAPA,
    title: "CAPA assigned to you",
    message: `${updated.capaNumber || "A new CAPA"} has been assigned to you.`,
    recordId: updated._id,
    recordNumber: updated.capaNumber,
    href: `/capa`,
    priority: "HIGH",
    dedupeKey: `CAPA_ASSIGNED:${updated._id}:${assignedToName}`,
  });

  return updated;
};

export const deleteCAPA = async ({ id, user, request = null } = {}) => {
  const capa = await getCAPAById({
    id,
    organizationId: user?.organizationId,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  });
  await CAPA.findByIdAndDelete(capa._id);
  await createAuditLogFromUser({
    user,
    action: "DELETE",
    module: "CAPA",
    recordId: capa._id,
    description: `Deleted CAPA ${capa.capaNumber}`,
    oldData: capa,
    newData: null,
    request,
  });
  return { success: true, message: "CAPA deleted successfully." };
};

export const getCAPAAuditLogs = async ({
  id,
  organizationId = null,
  isSuperAdmin = false,
  page = 1,
  limit = 50,
} = {}) => {
  const capa = await getCAPAById({ id, organizationId, isSuperAdmin });
  const { getRecordAuditLogs } =
    await import("@/services/auditLog/auditLog.service.js");
  return getRecordAuditLogs({
    recordId: capa._id,
    module: "CAPA",
    organizationId:
      capa.organizationId?._id || capa.organizationId || organizationId,
    isSuperAdmin,
    page,
    limit,
  });
};

export default {
  getCAPAs,
  getCAPAById,
  createCAPA,
  updateCAPA,
  updateCAPAStatus,
  assignCAPA,
  deleteCAPA,
  getCAPAAuditLogs,
};
