import api from "./axios";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
export const getAudits = async (params = {}) => {
  const r = await api.get("/audits", { params });
  return unwrap(r);
};
export const getAuditById = async (id) => {
  if (!id) throw new Error("Audit ID is required.");
  return unwrap(await api.get(`/audits/${id}`));
};
export const createAudit = async (data) =>
  unwrap(await api.post("/audits", data));
export const updateAudit = async (id, data) => {
  if (!id) throw new Error("Audit ID is required.");
  return unwrap(await api.put(`/audits/${id}`, data));
};
export const updateAuditStatus = async (id, data) =>
  unwrap(await api.patch(`/audits/${id}/status`, data));
export const deleteAudit = async (id) =>
  unwrap(await api.delete(`/audits/${id}`));
export const getAuditAuditLogs = async (id) =>
  unwrap(await api.get(`/audits/${id}/audit-logs`));
export const getAuditStatusOptions = async ({ organizationId = "" } = {}) => {
  const params = {};

  if (organizationId) {
    params.organizationId = organizationId;
  }

  const response = await api.get("/audits/status", { params });

  return response.data;
};
export default {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  updateAuditStatus,
  deleteAudit,
  getAuditAuditLogs,
};
