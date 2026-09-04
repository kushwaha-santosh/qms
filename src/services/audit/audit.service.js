import mongoose from "mongoose";

import Audit from "@/models/Audit.js";

import {
  resolveQMSReferences,
  getQMSStatusWorkflow,
} from "@/services/qms/qmsReference.service.js";

import { createAuditLogFromUser } from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// HELPERS
// ==========================================================

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const isSuperAdmin = (user) =>
  String(user?.role || "")
    .trim()
    .toUpperCase() === "SUPER_ADMIN";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.status = statusCode;
  error.statusCode = statusCode;

  return error;
};

const normalizeCode = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

// ==========================================================
// TENANT SCOPE
// ==========================================================

const scopeQuery = ({ user, organizationId = "" } = {}) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  if (isSuperAdmin(user)) {
    if (organizationId) {
      if (!validId(organizationId)) {
        throw createError("Invalid organization ID.", 400);
      }

      return {
        organizationId: new mongoose.Types.ObjectId(organizationId),
      };
    }

    return {};
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------
  const userOrganizationId = user?.organizationId?._id || user?.organizationId;

  if (!userOrganizationId) {
    throw createError("User organization is required.", 400);
  }

  if (!validId(userOrganizationId)) {
    throw createError("Invalid organization ID.", 400);
  }

  return {
    organizationId: new mongoose.Types.ObjectId(userOrganizationId),
  };

  // const userOrganizationId = user?.organizationId;

  // if (!userOrganizationId) {
  //   throw createError("User organization is required.", 400);
  // }

  // if (!validId(userOrganizationId)) {
  //   throw createError("Invalid organization ID.", 400);
  // }

  // return {
  //   organizationId: new mongoose.Types.ObjectId(userOrganizationId),
  // };
};

// ==========================================================
// AUDIT NUMBER
// ==========================================================

async function nextAuditNumber(organizationId) {
  const year = new Date().getFullYear();

  const prefix = `AUD-${year}-`;

  const last = await Audit.findOne({
    organizationId,
    auditNumber: new RegExp(`^${prefix}`),
  })
    .sort({
      auditNumber: -1,
    })
    .select("auditNumber")
    .lean();

  const n = last?.auditNumber
    ? Number(String(last.auditNumber).split("-").pop()) + 1
    : 1;

  return `${prefix}${String(n).padStart(4, "0")}`;
}

// ==========================================================
// PAYLOAD NORMALIZATION
// ==========================================================

function normalizePayload(data = {}) {
  return {
    title: String(data.title || "").trim(),

    // Audit Type remains normalized because it is a QMS reference code.
    auditType: normalizeCode(data.auditType),

    scope: String(data.scope || "").trim(),

    criteria: String(data.criteria || "").trim(),

    description: String(data.description || "").trim(),

    auditDate: data.auditDate || null,

    dueDate: data.dueDate || null,

    completedDate: data.completedDate || null,

    leadAuditor: data.leadAuditor || null,

    auditors: Array.isArray(data.auditors) ? data.auditors : [],

    department: data.department || "",

    process: data.process || "",

    location: data.location || null,

    product: data.product || null,

    /*
     * Common QMS STATUS.
     *
     * OPEN is the default status for a newly created Audit.
     */
    status: data.status || "OPEN",

    /*
     * Status comment is managed separately through the
     * status workflow.
     */
    statusComment: String(data.statusComment || "").trim(),

    findings: String(data.findings || "").trim(),

    ncrReferences: Array.isArray(data.ncrReferences) ? data.ncrReferences : [],

    capaReferences: Array.isArray(data.capaReferences)
      ? data.capaReferences
      : [],
  };
}

// ==========================================================
// QMS REFERENCES
// ==========================================================

async function resolveReferences(user, organizationId, data) {
  return resolveQMSReferences({
    user,
    organizationId,
    data,
    module: "AUDIT",
  });
}

// ==========================================================
// LIST AUDITS
// ==========================================================

export async function listAudits({ user, filters = {} }) {
  const {
    organizationId,
    search,
    status,
    auditType,
    department,
    page = 1,
    limit = 10,
  } = filters;

  const query = {
    ...scopeQuery({
      user,
      organizationId: isSuperAdmin(user) ? organizationId : "",
    }),
  };

  // --------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------

  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    query.$or = [
      { auditNumber: searchRegex },
      { title: searchRegex },
      { description: searchRegex },
      { department: searchRegex },
      { process: searchRegex },
    ];
  }

  // --------------------------------------------------------
  // STATUS
  // --------------------------------------------------------

  if (status?.trim()) {
    query.status = status.trim();
  }

  // --------------------------------------------------------
  // AUDIT TYPE
  // --------------------------------------------------------

  if (auditType?.trim()) {
    query.auditType = normalizeCode(auditType);
  }

  // --------------------------------------------------------
  // DEPARTMENT
  // --------------------------------------------------------

  if (department?.trim()) {
    query.department = department.trim();
  }

  // --------------------------------------------------------
  // PAGINATION
  // --------------------------------------------------------

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const [audits, total] = await Promise.all([
    Audit.find(query)
      .populate("organizationId", "name displayName companyName")
      .populate("leadAuditor", "firstName lastName email role")
      .populate("auditors", "firstName lastName email role")
      .populate(
        "location",
        "name displayName code parentId type pincode locationName",
      )
      .populate("product", "name code")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Audit.countDocuments(query),
  ]);

  const totalPages = Math.max(Math.ceil(total / limitNumber), 1);

  return {
    audits,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: totalPages,
      totalPages,
    },
  };
}

// ==========================================================
// GET AUDIT
// ==========================================================

export async function getAuditById({ user, id, organizationId = "" }) {
  if (!validId(id)) {
    throw createError("Invalid audit ID.", 400);
  }

  const audit = await Audit.findOne({
    _id: id,

    ...scopeQuery({
      user,
      organizationId: isSuperAdmin(user) ? organizationId : "",
    }),
  })
    .populate("organizationId", "name displayName companyName")
    .populate("leadAuditor", "firstName lastName email role")
    .populate("auditors", "firstName lastName email role")
    .populate(
      "location",
      "name displayName code parentId type pincode locationName",
    )
    .populate("product", "name code")
    .lean();

  if (!audit) {
    throw createError("Audit not found.", 404);
  }

  return audit;
}

// ==========================================================
// CREATE AUDIT
// ==========================================================

export async function createAudit({ user, data = {} }) {
  let organizationId = "";

  // --------------------------------------------------------
  // ORGANIZATION
  // --------------------------------------------------------

  if (isSuperAdmin(user)) {
    organizationId = data.organizationId || "";

    if (!organizationId) {
      throw createError("Please select an organization.", 400);
    }
  } else {
    organizationId = user?.organizationId;

    if (!organizationId) {
      throw createError("User organization is required.", 400);
    }
  }

  if (!validId(organizationId)) {
    throw createError("Invalid organization ID.", 400);
  }

  // --------------------------------------------------------
  // RESOLVE QMS REFERENCES
  // --------------------------------------------------------

  const payload = await resolveReferences(
    user,
    organizationId,
    normalizePayload(data),
  );

  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  if (!payload.title) {
    throw createError("Audit title is required.", 400);
  }

  // --------------------------------------------------------
  // AUDIT NUMBER
  // --------------------------------------------------------

  const auditNumber = await nextAuditNumber(organizationId);

  // --------------------------------------------------------
  // CREATE
  // --------------------------------------------------------

  const audit = await Audit.create({
    ...payload,

    organizationId,

    auditNumber,

    createdBy: user?._id,

    updatedBy: user?._id,
  });

  // --------------------------------------------------------
  // AUDIT LOG
  // --------------------------------------------------------

  await createAuditLogFromUser({
    user,

    request: data.request,

    action: "CREATE",

    module: "AUDIT",

    recordId: audit._id,

    description: `Audit ${audit.auditNumber} created.`,

    newData: audit.toObject(),
  });

  return getAuditById({
    user,

    id: audit._id,

    organizationId,
  });
}

// ==========================================================
// UPDATE AUDIT
// ==========================================================

export async function updateAudit({ user, id, data = {} }) {
  if (!validId(id)) {
    throw createError("Invalid audit ID.", 400);
  }

  // --------------------------------------------------------
  // FIND EXISTING AUDIT
  // --------------------------------------------------------

  const existing = await Audit.findOne({
    _id: id,

    ...scopeQuery({
      user,
      organizationId: isSuperAdmin(user) ? data.organizationId || "" : "",
    }),
  });

  if (!existing) {
    throw createError("Audit not found.", 404);
  }

  const existingOrganizationId = existing.organizationId;

  // --------------------------------------------------------
  // RESOLVE REFERENCES
  // --------------------------------------------------------

  const payload = await resolveReferences(
    user,
    existingOrganizationId,
    normalizePayload({
      ...existing.toObject(),
      ...data,
    }),
  );

  /*
   * Status is controlled separately by the
   * status workflow.
   *
   * The Edit Audit form must not change status.
   */
  delete payload.status;

  /*
   * Status comments are also controlled by the
   * status workflow.
   */
  delete payload.statusComment;

  /*
   * Organization, audit number and creator
   * are immutable.
   */
  delete payload.organizationId;

  delete payload.auditNumber;

  delete payload.createdBy;

  // --------------------------------------------------------
  // AUDIT LOG DATA
  // --------------------------------------------------------

  const oldData = existing.toObject();

  // --------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------

  Object.assign(existing, payload, {
    updatedBy: user?._id,
  });

  await existing.save();

  // --------------------------------------------------------
  // AUDIT LOG
  // --------------------------------------------------------

  await createAuditLogFromUser({
    user,

    request: data.request,

    action: "UPDATE",

    module: "AUDIT",

    recordId: existing._id,

    description: `Audit ${existing.auditNumber} updated.`,

    oldData,

    newData: existing.toObject(),
  });

  return getAuditById({
    user,

    id,

    organizationId: existing.organizationId,
  });
}

// ==========================================================
// UPDATE AUDIT STATUS
// ==========================================================

export async function updateAuditStatus({
  user,
  id,
  status,
  comment = "",
  request,
}) {
  if (!validId(id)) {
    throw createError("Invalid audit ID.", 400);
  }

  // --------------------------------------------------------
  // FIND AUDIT
  // --------------------------------------------------------

  const audit = await Audit.findOne({
    _id: id,

    ...scopeQuery({
      user,
    }),
  });

  if (!audit) {
    throw createError("Audit not found.", 404);
  }

  const auditOrganizationId = audit.organizationId;

  // --------------------------------------------------------
  // COMMON QMS STATUS WORKFLOW
  // --------------------------------------------------------

  const statusOptions = await getQMSStatusWorkflow({
    user,

    organizationId: auditOrganizationId,

    module: "AUDIT",
  });

  if (!statusOptions || !Array.isArray(statusOptions.statuses)) {
    throw createError("Audit status master data is not configured.", 400);
  }

  // --------------------------------------------------------
  // STATUS
  // --------------------------------------------------------

  const newStatus = String(status || "").trim();

  if (!newStatus) {
    throw createError("Status is required.", 400);
  }

  /*
   * Compare directly with the common QMS
   * status master data.
   */
  const normalizedStatuses = statusOptions.statuses.map((item) =>
    String(
      typeof item === "object"
        ? item.code || item.key || item.value || item.name || item.label || ""
        : item,
    ).trim(),
  );

  const matchedStatus = normalizedStatuses.find(
    (item) => item.toUpperCase() === newStatus.toUpperCase(),
  );

  if (!matchedStatus) {
    throw createError(
      "Invalid audit status. Please select an active status from Master Data.",
      400,
    );
  }

  /*
   * Store the actual Master Data value.
   */
  const finalStatus = matchedStatus;

  // --------------------------------------------------------
  // CURRENT STATUS
  // --------------------------------------------------------

  const currentStatus = String(audit.status || "OPEN").trim();

  if (currentStatus.toUpperCase() === finalStatus.toUpperCase()) {
    throw createError(`Audit is already in ${finalStatus} status.`, 400);
  }

  // --------------------------------------------------------
  // STATUS COMMENT
  // --------------------------------------------------------

  const statusComment = String(comment || "").trim();

  // --------------------------------------------------------
  // OLD DATA
  // --------------------------------------------------------

  const oldData = {
    status: audit.status,

    completedDate: audit.completedDate,

    statusComment: audit.statusComment || "",
  };

  // --------------------------------------------------------
  // UPDATE STATUS
  // --------------------------------------------------------

  audit.status = finalStatus;

  /*
   * Explicitly persist the latest status comment.
   *
   * This field exists in AuditSchema and therefore
   * will be persisted with strict mode enabled.
   */
  audit.statusComment = statusComment;

  // --------------------------------------------------------
  // COMPLETION DATE
  // --------------------------------------------------------

  if (finalStatus.toUpperCase() === "COMPLETED") {
    audit.completedDate = new Date();
  }

  audit.updatedBy = user?._id;

  // --------------------------------------------------------
  // SAVE
  // --------------------------------------------------------

  await audit.save();

  // --------------------------------------------------------
  // AUDIT LOG
  // --------------------------------------------------------

  await createAuditLogFromUser({
    user,

    request,

    action: "STATUS_UPDATE",

    module: "AUDIT",

    recordId: audit._id,

    description: statusComment
      ? `Audit status changed from ${currentStatus} to ${finalStatus}: ${statusComment}`
      : `Audit status changed from ${currentStatus} to ${finalStatus}.`,

    oldData,

    newData: {
      status: audit.status,

      completedDate: audit.completedDate,

      statusComment: audit.statusComment || "",
    },
  });

  // --------------------------------------------------------
  // RETURN UPDATED AUDIT
  // --------------------------------------------------------

  return getAuditById({
    user,

    id,

    organizationId: audit.organizationId,
  });
}

// ==========================================================
// DELETE AUDIT
// ==========================================================

export async function deleteAudit({ user, id, request, organizationId = "" }) {
  if (!validId(id)) {
    throw createError("Invalid audit ID.", 400);
  }

  const existing = await Audit.findOne({
    _id: id,

    ...scopeQuery({
      user,

      organizationId: isSuperAdmin(user) ? organizationId : "",
    }),
  });

  if (!existing) {
    throw createError("Audit not found.", 404);
  }

  const oldData = existing.toObject();

  const result = await Audit.deleteOne({
    _id: id,

    ...scopeQuery({
      user,

      organizationId: existing.organizationId,
    }),
  });

  if (result.deletedCount !== 1) {
    throw createError("Audit could not be deleted.", 500);
  }

  await createAuditLogFromUser({
    user,

    request,

    action: "DELETE",

    module: "AUDIT",

    recordId: id,

    description: `Audit ${existing.auditNumber} deleted.`,

    oldData,
  });

  return {
    success: true,

    message: `Audit ${existing.auditNumber} was deleted successfully.`,
  };
}

// ==========================================================
// AUDIT STATUS OPTIONS
// ==========================================================

export async function getAuditStatusOptions({ user, organizationId = "" }) {
  const workflow = await getQMSStatusWorkflow({
    user,

    organizationId: isSuperAdmin(user) ? organizationId : user?.organizationId,

    module: "AUDIT",
  });

  return {
    statuses: workflow?.statuses || [],

    aliases: workflow?.aliases || {},

    transitions: workflow?.transitions || {},
  };
}

export const getAuditAuditLogs = async ({
  user,
  id,
  organizationId = null,
  page = 1,
  limit = 50,
} = {}) => {
  const audit = await getAuditById({
    user,
    id,
    organizationId,
  });

  const { getRecordAuditLogs } =
    await import("@/services/auditLog/auditLog.service.js");

  return getRecordAuditLogs({
    recordId: audit._id,
    module: "AUDIT",
    organizationId:
      audit.organizationId?._id || audit.organizationId || organizationId,
    isSuperAdmin: isSuperAdmin(user),
    page,
    limit,
  });
};
