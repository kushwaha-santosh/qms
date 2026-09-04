import api from "./axios";

const unwrap = (response) => response?.data?.data ?? response?.data;

const unwrapNCR = (response) => {
  const data = unwrap(response);
  return data?.ncr || data?.record || data?.item || data;
};

export const getNCRs = async (params = {}) =>
  unwrap(await api.get("/ncr", { params }));

export const getNCRById = async (ncrId, params = {}) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  return unwrapNCR(await api.get("/ncr", { params: { ...params, id: ncrId } }));
};

export const createNCR = async (data = {}) =>
  unwrap(await api.post("/ncr", data));

export const updateNCR = async (ncrId, data = {}) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  return unwrapNCR(await api.patch("/ncr", { ...data, ncrId }));
};

export const updateNCRStatus = async (ncrId, data = {}) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  return unwrapNCR(
    await api.patch("/ncr", { ...data, ncrId, action: "STATUS" }),
  );
};

export const assignNCR = async (ncrId, assignedTo) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  if (!assignedTo) throw new Error("Assigned user is required.");
  return unwrapNCR(
    await api.patch("/ncr", { ncrId, assignedTo, action: "ASSIGN" }),
  );
};

export const deleteNCR = async (ncrId) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  return unwrap(await api.delete("/ncr", { params: { id: ncrId } }));
};

export const getNCRAuditLogs = async (ncrId) => {
  if (!ncrId) throw new Error("NCR ID is required.");
  const response = await api.get(`/ncr/${ncrId}/audit-logs`);
  const data = unwrap(response);
  return (
    data?.auditLogs ||
    data?.logs ||
    data?.records ||
    (Array.isArray(data) ? data : [])
  );
};

export default {
  getNCRs,
  getNCRById,
  createNCR,
  updateNCR,
  updateNCRStatus,
  assignNCR,
  deleteNCR,
  getNCRAuditLogs,
};
