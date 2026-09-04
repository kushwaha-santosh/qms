import api from "@/lib/api/axios.js";

const getResponseData = (response) => response?.data?.data ?? response?.data ?? response;

export const getCAPAs = async (params = {}) => {
  const response = await api.get("/capa", { params });
  return getResponseData(response);
};

export const getCAPAOrganizations = async () => {
  const response = await api.get("/capa/organizations", {
    params: { status: "ACTIVE", page: 1, limit: 100 },
  });
  return getResponseData(response);
};

export const getCAPA = async (id) => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.get(`/capa/${encodeURIComponent(id)}`);
  return getResponseData(response);
};

export const createCAPA = async (data) => {
  const response = await api.post("/capa", data);
  return getResponseData(response);
};

export const updateCAPA = async (id, data) => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.put(`/capa/${encodeURIComponent(id)}`, data);
  return getResponseData(response);
};

export const updateCAPAStatus = async (id, status, comments = "") => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.patch(`/capa/${encodeURIComponent(id)}/status`, { status, comments });
  return response.data?.data || response.data;
};

export const assignCAPA = async (id, assignedTo) => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.patch(`/capa/${encodeURIComponent(id)}/assign`, { assignedTo });
  return getResponseData(response);
};

export const deleteCAPA = async (id) => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.delete(`/capa/${encodeURIComponent(id)}`);
  return getResponseData(response);
};

export const getCAPAAuditLogs = async (id, params = {}) => {
  if (!id) throw new Error("CAPA ID is required.");
  const response = await api.get(`/capa/${encodeURIComponent(id)}/audit-logs`, { params });
  return getResponseData(response);
};
