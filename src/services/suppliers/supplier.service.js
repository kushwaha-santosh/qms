import mongoose from "mongoose";
import Supplier from "@/models/Supplier.js";
import MasterData from "@/models/MasterData.js";
import { createAuditLogFromUser } from "@/services/auditLog/auditLog.service.js";

const superAdmin = (u) => String(u?.role || "").toUpperCase() === "SUPER_ADMIN";
const valid = (v) => mongoose.Types.ObjectId.isValid(v);
const text = (v) => String(v ?? "").trim();
const upper = (v) => text(v).toUpperCase();
const err = (m, s = 400) => Object.assign(new Error(m), { statusCode: s });
const org = (u) => u?.organizationId?._id || u?.organizationId || null;
const getOrg = (u, requested = null) => {
  const id = superAdmin(u) ? requested || org(u) : org(u);
  if (!id || !valid(id))
    throw err(
      superAdmin(u)
        ? "Valid organization ID is required."
        : "User organization is required.",
      400,
    );
  return id;
};
const scope = (u) =>
  superAdmin(u)
    ? {}
    : { organizationId: new mongoose.Types.ObjectId(getOrg(u)) };
const payload = (d) => ({
  supplierCode: upper(d.supplierCode),
  name: text(d.name),
  supplierType: upper(d.supplierType),
  category: upper(d.category),
  contactPerson: text(d.contactPerson),
  email: text(d.email).toLowerCase(),
  phone: text(d.phone),
  address: text(d.address),
  country: text(d.country),
  rating: d.rating === "" || d.rating == null ? null : Number(d.rating),
  status: upper(d.status),
  statusComment: text(d.statusComment),
  description: text(d.description),
  qualificationDate: d.qualificationDate || null,
  nextReviewDate: d.nextReviewDate || null,
});
const masterScope = async (user, organizationId, type, value) => {
  if (!value) return null;
  const q = {
    type,
    isActive: true,
    code: String(value).trim().toUpperCase(),
    $or: [
      { organizationId: null },
      { organizationId: new mongoose.Types.ObjectId(organizationId) },
    ],
  };
  const found = await MasterData.findOne(q)
    .select("_id code name organizationId isSystem isActive")
    .lean();
  if (!found)
    throw err(
      `${type} master data is invalid, inactive, or not available for this user.`,
      400,
    );
  return found;
};
const resolve = async (user, organizationId, data) => {
  const [supplierType, category, status] = await Promise.all([
    masterScope(user, organizationId, "SUPPLIER_TYPE", data.supplierType),
    masterScope(user, organizationId, "QMS_CATEGORY", data.category),
    masterScope(user, organizationId, "QMS_STATUS", data.status),
  ]);
  return {
    ...data,
    supplierType: supplierType?.code || data.supplierType,
    category: category?.code || data.category,
    status: status?.code || data.status || "OPEN",
  };
};
const audit = (p) =>
  Promise.resolve(createAuditLogFromUser(p)).catch((e) =>
    console.error("SUPPLIER AUDIT LOG ERROR:", e),
  );
export async function listSuppliers({ user, filters = {} } = {}) {
  const q = { ...scope(user) };
  const s = text(filters.search),
    st = upper(filters.status),
    type = upper(filters.supplierType),
    cat = upper(filters.category);
  const page = Math.max(Number(filters.page) || 1, 1),
    limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  if (s)
    q.$or = [
      { supplierCode: { $regex: s, $options: "i" } },
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { contactPerson: { $regex: s, $options: "i" } },
    ];
  if (st) q.status = st;
  if (type) q.supplierType = type;
  if (cat) q.category = cat;
  const [suppliers, total] = await Promise.all([
    Supplier.find(q)
      .populate("organizationId", "name")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Supplier.countDocuments(q),
  ]);
  return {
    suppliers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
export async function getSupplierById({ user, id } = {}) {
  if (!id || !valid(id)) throw err("Invalid supplier ID.");
  const r = await Supplier.findOne({ _id: id, ...scope(user) })
    .populate("organizationId", "name")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .lean();
  if (!r) throw err("Supplier not found.", 404);
  return r;
}
export async function createSupplier({ user, data = {} } = {}) {
  const organizationId = getOrg(user, data.organizationId),
    p = payload(data);
  if (!p.supplierCode) throw err("Supplier code is required.");
  if (!p.name) throw err("Supplier name is required.");
  const r = await resolve(user, organizationId, p);
  const d = await Supplier.findOne({
    organizationId,
    supplierCode: r.supplierCode,
  }).lean();
  if (d) throw err("A supplier with this code already exists.", 409);
  const created = await Supplier.create({
    ...r,
    organizationId,
    createdBy: user._id,
    updatedBy: user._id,
  });
  audit({
    user,
    action: "CREATE",
    module: "SUPPLIER",
    recordId: created._id,
    description: `Created supplier ${created.supplierCode}`,
  });
  return getSupplierById({ user, id: created._id });
}
export async function updateSupplier({ user, id, data = {} } = {}) {
  if (!id || !valid(id)) throw err("Invalid supplier ID.");
  const existing = await Supplier.findOne({ _id: id, ...scope(user) });
  if (!existing) throw err("Supplier not found.", 404);
  const merged = { ...existing.toObject(), ...payload(data) },
    r = await resolve(user, existing.organizationId, merged);
  if (r.supplierCode && r.supplierCode !== existing.supplierCode) {
    const d = await Supplier.findOne({
      organizationId: existing.organizationId,
      supplierCode: r.supplierCode,
      _id: { $ne: id },
    }).lean();
    if (d) throw err("A supplier with this code already exists.", 409);
  }
  Object.assign(existing, r, { updatedBy: user._id });
  await existing.save();
  audit({
    user,
    action: "UPDATE",
    module: "SUPPLIER",
    recordId: id,
    description: `Updated supplier ${existing.supplierCode}`,
  });
  return getSupplierById({ user, id });
}
export async function updateSupplierStatus({
  user,
  id,
  status,
  statusComment = "",
} = {}) {
  if (!id || !valid(id)) throw err("Invalid supplier ID.");
  const r = await Supplier.findOne({ _id: id, ...scope(user) });
  if (!r) throw err("Supplier not found.", 404);
  const next = upper(status);
  if (!next) throw err("Status is required.");
  const validStatus = await masterScope(
    user,
    r.organizationId,
    "QMS_STATUS",
    next,
  );
  if (!validStatus)
    throw err(
      "Selected status is invalid, inactive, or not available for this user.",
      400,
    );
  const old = r.status;
  r.status = validStatus.code;
  r.statusComment = text(statusComment);
  r.updatedBy = user._id;
  await r.save();
  audit({
    user,
    action: "STATUS_UPDATE",
    module: "SUPPLIER",
    recordId: id,
    description: `Supplier status changed from ${old} to ${next}`,
    oldData: { status: old },
    newData: { status: next, statusComment: r.statusComment },
  });
  return getSupplierById({ user, id });
}
export async function deleteSupplier({ user, id } = {}) {
  if (!id || !valid(id)) throw err("Invalid supplier ID.");
  const r = await Supplier.findOne({ _id: id, ...scope(user) });
  if (!r) throw err("Supplier not found.", 404);
  await r.deleteOne();
  audit({
    user,
    action: "DELETE",
    module: "SUPPLIER",
    recordId: id,
    description: `Deleted supplier ${r.supplierCode}`,
  });
  return { success: true, id };
}
export async function getSupplierAuditLogs({
  user,
  id,
  page = 1,
  limit = 50,
} = {}) {
  const r = await getSupplierById({ user, id });
  const { getRecordAuditLogs } =
    await import("@/services/auditLog/auditLog.service.js");
  return getRecordAuditLogs({
    recordId: r._id,
    module: "SUPPLIER",
    organizationId: r.organizationId?._id || r.organizationId,
    isSuperAdmin: superAdmin(user),
    page,
    limit,
  });
}
