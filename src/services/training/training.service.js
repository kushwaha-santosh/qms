import mongoose from "mongoose";
import Training from "@/models/Training.js";
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
  trainingNumber: upper(d.trainingNumber),
  title: text(d.title),
  trainingType: upper(d.trainingType),
  department: upper(d.department),
  trainer: d.trainer ? String(d.trainer) : null,
  participants: Array.isArray(d.participants)
    ? d.participants.map(String).filter(Boolean)
    : [],
  scheduledDate: d.scheduledDate || null,
  completionDate: d.completionDate || null,
  dueDate: d.dueDate || null,
  status: upper(d.status),
  statusComment: text(d.statusComment),
  description: text(d.description),
  remarks: text(d.remarks),
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
  const [trainingType, department, status] = await Promise.all([
    masterScope(user, organizationId, "TRAINING_TYPE", data.trainingType),
    masterScope(user, organizationId, "DEPARTMENT", data.department),
    masterScope(user, organizationId, "QMS_STATUS", data.status),
  ]);
  return {
    ...data,
    trainingType: trainingType?.code || data.trainingType,
    department: department?.code || data.department,
    status: status?.code || data.status,
  };
};
const audit = (p) =>
  Promise.resolve(createAuditLogFromUser(p)).catch((e) =>
    console.error("TRAINING AUDIT LOG ERROR:", e),
  );

export async function listTrainings({ user, filters = {} } = {}) {
  const q = { ...scope(user) };
  const s = text(filters.search),
    st = upper(filters.status),
    tt = upper(filters.trainingType),
    dep = upper(filters.department);
  const page = Math.max(Number(filters.page) || 1, 1),
    limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  if (s)
    q.$or = [
      { trainingNumber: { $regex: s, $options: "i" } },
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
    ];
  if (st) q.status = st;
  if (tt) q.trainingType = tt;
  if (dep) q.department = dep;
  const [trainings, total] = await Promise.all([
    Training.find(q)
      .populate("organizationId", "name")
      .populate("trainer", "firstName lastName email")
      .populate("participants", "firstName lastName email")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Training.countDocuments(q),
  ]);
  return {
    trainings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
export async function getTrainingById({ user, id } = {}) {
  if (!id || !valid(id)) throw err("Invalid training ID.");
  const r = await Training.findOne({ _id: id, ...scope(user) })
    .populate("organizationId", "name")
    .populate("trainer", "firstName lastName email")
    .populate("participants", "firstName lastName email")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .lean();
  if (!r) throw err("Training not found.", 404);
  return r;
}
export async function createTraining({ user, data = {} } = {}) {
  const organizationId = getOrg(user, data.organizationId),
    p = payload(data);
  if (!p.trainingNumber) throw err("Training number is required.");
  if (!p.title) throw err("Training title is required.");
  if (!p.status) {
    p.status = "OPEN";
  }
  const r = await resolve(user, organizationId, p);
  const duplicate = await Training.findOne({
    organizationId,
    trainingNumber: r.trainingNumber,
  }).lean();
  if (duplicate)
    throw err("A training with this training number already exists.", 409);
  const created = await Training.create({
    ...r,
    organizationId,
    createdBy: user._id,
    updatedBy: user._id,
  });
  audit({
    user,
    action: "CREATE",
    module: "TRAINING",
    recordId: created._id,
    description: `Created training ${created.trainingNumber}`,
  });
  return getTrainingById({ user, id: created._id });
}
export async function updateTraining({ user, id, data = {} } = {}) {
  if (!id || !valid(id)) throw err("Invalid training ID.");
  const existing = await Training.findOne({ _id: id, ...scope(user) });
  if (!existing) throw err("Training not found.", 404);
  const merged = { ...existing.toObject(), ...payload(data) },
    r = await resolve(user, existing.organizationId, merged);
  if (r.trainingNumber && r.trainingNumber !== existing.trainingNumber) {
    const d = await Training.findOne({
      organizationId: existing.organizationId,
      trainingNumber: r.trainingNumber,
      _id: { $ne: id },
    }).lean();
    if (d)
      throw err("A training with this training number already exists.", 409);
  }
  Object.assign(existing, r, { updatedBy: user._id });
  await existing.save();
  audit({
    user,
    action: "UPDATE",
    module: "TRAINING",
    recordId: id,
    description: `Updated training ${existing.trainingNumber}`,
  });
  return getTrainingById({ user, id });
}
export async function updateTrainingStatus({
  user,
  id,
  status,
  statusComment = "",
} = {}) {
  if (!id || !valid(id)) throw err("Invalid training ID.");
  const r = await Training.findOne({ _id: id, ...scope(user) });
  if (!r) throw err("Training not found.", 404);
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
    module: "TRAINING",
    recordId: id,
    description: `Training status changed from ${old} to ${next}`,
    oldData: { status: old },
    newData: { status: next, statusComment: r.statusComment },
  });
  return getTrainingById({ user, id });
}
export async function deleteTraining({ user, id } = {}) {
  if (!id || !valid(id)) throw err("Invalid training ID.");
  const r = await Training.findOne({ _id: id, ...scope(user) });
  if (!r) throw err("Training not found.", 404);
  await r.deleteOne();
  audit({
    user,
    action: "DELETE",
    module: "TRAINING",
    recordId: id,
    description: `Deleted training ${r.trainingNumber}`,
  });
  return { success: true, id };
}
export async function getTrainingAuditLogs({
  user,
  id,
  page = 1,
  limit = 50,
} = {}) {
  const r = await getTrainingById({ user, id });
  const { getRecordAuditLogs } =
    await import("@/services/auditLog/auditLog.service.js");
  return getRecordAuditLogs({
    recordId: r._id,
    module: "TRAINING",
    organizationId: r.organizationId?._id || r.organizationId,
    isSuperAdmin: superAdmin(user),
    page,
    limit,
  });
}
