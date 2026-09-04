import api from "./axios";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
export const getTrainings = async (params = {}) =>
  unwrap(await api.get("/training", { params }));
export const getTrainingById = async (id) =>
  unwrap(await api.get(`/training/${id}`));
export const createTraining = async (data) =>
  unwrap(await api.post("/training", data));
export const updateTraining = async (id, data) =>
  unwrap(await api.put(`/training/${id}`, data));
export const updateTrainingStatus = async (id, data) =>
  unwrap(await api.patch(`/training/${id}/status`, data));
export const deleteTraining = async (id) =>
  unwrap(await api.delete(`/training/${id}`));
export const getTrainingAuditLogs = async (id) =>
  unwrap(await api.get(`/training/${id}/audit-logs`));
