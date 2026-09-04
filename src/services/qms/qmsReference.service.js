import mongoose from "mongoose";

import MasterData from "@/models/MasterData.js";
import Product from "@/models/Product.js";
import Location from "@/models/Location.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalize = (value) => String(value ?? "").trim();
const normalizeUpper = (value) => normalize(value).toUpperCase();

const statusAlias = (value) => {
  const normalized = normalizeUpper(value);
  const aliases = {
    "UNDER INVESTIGATION": "UNDER_REVIEW",
    UNDER_INVESTIGATION: "UNDER_REVIEW",
    "UNDER REVIEW": "UNDER_REVIEW",
    "ACTION IN PROGRESS": "ACTION_IN_PROGRESS",
    "PENDING VERIFICATION": "PENDING_VERIFICATION",
    VERIFICATION: "VERIFICATION",
  };
  return aliases[normalized] || normalized;
};

const isSuperAdmin = (user) => normalizeUpper(user?.role) === "SUPER_ADMIN";

const organizationForUser = (user, organizationId = null) =>
  organizationId || user?.organizationId?._id || user?.organizationId || null;

const scopeQuery = ({ user, organizationId = null } = {}) => {
  const orgId = organizationForUser(user, organizationId);

  if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
    if (isSuperAdmin(user)) return {};
    throw createError("Valid organization information is required.", 400);
  }

  return {
    $or: [
      { organizationId: new mongoose.Types.ObjectId(orgId) },
      { organizationId: null, isSystem: true },
    ],
  };
};

const idOf = (value) => {
  if (!value) return "";
  return String(value?._id || value?.id || value);
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

/*
 * Master-data applicability is intentionally flexible so existing records
 * continue to work even if metadata is not populated yet.
 * Supported metadata keys:
 *   module / modules
 *   applicableTo / applicableModules
 *   entity / entities
 *
 * If no applicability metadata exists, the master is considered shared.
 */
const masterAppliesToModule = (item, module) => {
  const target = normalizeUpper(module);
  if (!target) return true;

  const metadata = item?.metadata || {};
  const candidates = [
    metadata.module,
    metadata.modules,
    metadata.applicableTo,
    metadata.applicableModules,
    metadata.entity,
    metadata.entities,
  ].flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []));

  if (candidates.length) {
    return candidates.some((value) => {
      const normalized = normalizeUpper(value);
      return (
        normalized === target || normalized === "ALL" || normalized === "QMS"
      );
    });
  }

  // Optional convention for status codes such as NCR_OPEN / CAPA_OPEN.
  const code = normalizeUpper(item?.code);
  if (code.startsWith("NCR_")) return target === "NCR";
  if (code.startsWith("CAPA_")) return target === "CAPA";

  return true;
};

const masterValueMatches = (item, value) => {
  const raw = normalize(value);
  if (!raw) return false;
  const upper = raw.toUpperCase();
  const code = normalizeUpper(item?.code);
  const name = normalizeUpper(item?.name);
  return (
    code === upper ||
    name === upper ||
    statusAlias(code) === statusAlias(upper) ||
    statusAlias(name) === statusAlias(upper)
  );
};

export const getQMSMasterOptions = async ({
  user,
  organizationId = null,
  type,
  module = "",
  includeInactive = false,
} = {}) => {
  const normalizedType = normalizeUpper(type);
  if (!normalizedType) return [];

  const scope = scopeQuery({ user, organizationId });
  const query = {
    $and: [
      {
        type: normalizedType,
        ...(includeInactive ? {} : { isActive: true }),
        ...scope,
      },
    ],
  };

  const records = await MasterData.find(query)
    .select(
      "_id type code name description organizationId isSystem isActive sortOrder metadata",
    )
    .sort({ isSystem: -1, sortOrder: 1, name: 1 })
    .lean();

  return records.filter((item) => masterAppliesToModule(item, module));
};

export const resolveQMSMasterCode = async ({
  user,
  organizationId = null,
  type,
  value,
  field,
  required = false,
  module = "",
} = {}) => {
  const raw = normalize(value);

  if (!raw) {
    if (required) throw createError(`${field || type} is required.`, 400);
    return "";
  }

  const options = await getQMSMasterOptions({
    user,
    organizationId,
    type,
    module,
  });

  const master = options.find((item) => masterValueMatches(item, raw));

  if (!master) {
    throw createError(
      `Selected ${field || type} is invalid, inactive, or not available.`,
      400,
    );
  }

  return String(master.code || master.name || normalizeUpper(raw));
};

const resolveEntity = async ({
  Model,
  user,
  organizationId,
  value,
  field,
  modelLabel,
} = {}) => {
  const raw = normalize(value);
  if (!raw) return "";

  const scope = scopeQuery({ user, organizationId });
  const valueQuery = mongoose.Types.ObjectId.isValid(raw)
    ? { _id: new mongoose.Types.ObjectId(raw) }
    : {
        $or: [
          { code: normalizeUpper(raw) },
          { name: new RegExp(`^${escapeRegex(raw)}$`, "i") },
        ],
      };

  const entity = await Model.findOne({
    $and: [{ isActive: true, ...scope }, valueQuery],
  })
    .select("_id code name")
    .lean();

  if (!entity) {
    throw createError(
      `Selected ${field || modelLabel} is invalid, inactive, or not available.`,
      400,
    );
  }

  return idOf(entity);
};

export const resolveQMSProduct = (args = {}) =>
  resolveEntity({ ...args, Model: Product, modelLabel: "product" });

export const resolveQMSLocation = async ({
  user,
  organizationId = null,
  value,
  field = "location",
} = {}) => {
  const raw = normalize(value);
  if (!raw) return "";
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    throw createError(
      `Selected ${field} is invalid, inactive, or not available.`,
      400,
    );
  }

  const id = new mongoose.Types.ObjectId(raw);
  const requestedOrg = organizationForUser(user, organizationId);
  const query = { _id: id, isActive: true };

  // Locations are hierarchical reference data. A location may be global
  // (organizationId=null) or owned by the selected organization. Do not
  // require isSystem=true for global locations because older location
  // records may predate that flag.
  if (!isSuperAdmin(user)) {
    if (!requestedOrg || !mongoose.Types.ObjectId.isValid(requestedOrg)) {
      throw createError("Valid organization information is required.", 400);
    }
    query.$or = [
      { organizationId: new mongoose.Types.ObjectId(requestedOrg) },
      { organizationId: null },
    ];
  } else if (organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw createError("Invalid organization ID.", 400);
    }
    query.$or = [
      { organizationId: new mongoose.Types.ObjectId(organizationId) },
      { organizationId: null },
    ];
  }

  const entity = await Location.findOne(query)
    .select("_id code name organizationId isSystem isActive")
    .lean();
  if (!entity) {
    throw createError(
      `Selected ${field} is invalid, inactive, or not available.`,
      400,
    );
  }
  return idOf(entity);
};

export const resolveQMSDefaultStatus = async ({
  user,
  organizationId = null,
  module,
  preferred = "OPEN",
} = {}) => {
  const options = await getQMSMasterOptions({
    user,
    organizationId,
    type: "QMS_STATUS",
    module,
  });

  if (!options.length) {
    throw createError(
      `No active QMS_STATUS master data is configured for ${module || "this module"}.`,
      400,
    );
  }

  const preferredMatch = options.find((item) =>
    masterValueMatches(item, preferred),
  );

  return String(
    (preferredMatch || options[0]).code || (preferredMatch || options[0]).name,
  );
};

const metadataNextStatuses = (item) => {
  const metadata = item?.metadata || {};
  const value =
    metadata.allowedNextStatuses ??
    metadata.nextStatuses ??
    metadata.transitions ??
    metadata.allowedTransitions;

  if (!value) return null;
  if (Array.isArray(value)) return value.map(normalizeUpper).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map(normalizeUpper).filter(Boolean);
  }
  return null;
};

export const getQMSStatusWorkflow = async ({
  user,
  organizationId = null,
  module,
} = {}) => {
  const options = await getQMSMasterOptions({
    user,
    organizationId,
    type: "QMS_STATUS",
    module,
  });

  const statuses = options.map((item) =>
    normalizeUpper(item.code || item.name),
  );
  const aliases = Object.fromEntries(
    options.map((item) => [
      statusAlias(item.code || item.name),
      normalizeUpper(item.code || item.name),
    ]),
  );
  if (statuses.includes("PENDING_VERIFICATION"))
    aliases.VERIFICATION = "PENDING_VERIFICATION";
  if (statuses.includes("UNDER_REVIEW"))
    aliases.UNDER_INVESTIGATION = "UNDER_REVIEW";
  const labels = Object.fromEntries(
    options.map((item) => [
      normalizeUpper(item.code || item.name),
      item.name || item.code,
    ]),
  );

  const byCode = new Map(
    options.map((item) => [normalizeUpper(item.code || item.name), item]),
  );

  // Status changes are intentionally unrestricted: any active master status
  // may be changed to any other active master status at any time. The
  // database remains the single source of truth for the available statuses.
  const transitions = Object.fromEntries(
    statuses.map((status) => [
      status,
      statuses.filter((next) => next !== status),
    ]),
  );
  return { statuses, labels, transitions, options, aliases };
};

export const resolveQMSReferences = async ({
  user,
  organizationId = null,
  data = {},
  includeStatus = false,
  module = "",
} = {}) => {
  const [
    category,
    source,
    severity,
    department,
    process,
    product,
    location,
    supplier,
    rootCauseCategory,
    status,
  ] = await Promise.all([
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "QMS_CATEGORY",
      value: data.category,
      field: "category",
      module,
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "QMS_SOURCE",
      value: data.source,
      field: "source",
      module,
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "QMS_SEVERITY",
      value: data.severity,
      field: "severity",
      module,
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "DEPARTMENT",
      value: data.department,
      field: "department",
      module,
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "PROCESS",
      value: data.process,
      field: "process",
      module,
    }),
    resolveQMSProduct({
      user,
      organizationId,
      value: data.product,
      field: "product",
    }),
    resolveQMSLocation({
      user,
      organizationId,
      value: data.location,
      field: "location",
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "SUPPLIER",
      value: data.supplier,
      field: "supplier",
    }),
    resolveQMSMasterCode({
      user,
      organizationId,
      type: "ROOT_CAUSE_CATEGORY",
      value: data.rootCauseCategory,
      field: "root cause category",
      module,
    }),
    includeStatus
      ? resolveQMSMasterCode({
          user,
          organizationId,
          type: "QMS_STATUS",
          value: data.status,
          field: "status",
          required: false,
          module,
        })
      : Promise.resolve(""),
  ]);

  return {
    ...data,
    category,
    source,
    severity,
    department,
    process,
    product,
    location,
    supplier,
    rootCauseCategory,
    ...(includeStatus ? { status } : {}),
  };
};
