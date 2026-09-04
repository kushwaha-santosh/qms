import api from "./axios";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
export const getSuppliers = async (params = {}) =>
  unwrap(await api.get("/suppliers", { params }));
export const getSupplierById = async (id) =>
  unwrap(await api.get(`/suppliers/${id}`));
export const createSupplier = async (data) =>
  unwrap(await api.post("/suppliers", data));
export const updateSupplier = async (id, data) =>
  unwrap(await api.put(`/suppliers/${id}`, data));
export const updateSupplierStatus = async (id, data) =>
  unwrap(await api.patch(`/suppliers/${id}/status`, data));
export const deleteSupplier = async (id) =>
  unwrap(await api.delete(`/suppliers/${id}`));
export const getSupplierAuditLogs = async (id) =>
  unwrap(await api.get(`/suppliers/${id}/audit-logs`));
