import api from "./axios";

export const getUsers = async ({ page = 1, limit = 20, search = "", role = "", status = "", organizationId = "" } = {}) => {
  const response = await api.get("/users", { params: { page, limit, search: String(search || "").trim(), role, status, ...(organizationId ? { organizationId } : {}) } });
  return response.data;
};

export const getUser = async (userId) => {
  if (!userId) throw new Error("User ID is required.");
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async (userId, data) => {
  if (!userId) throw new Error("User ID is required.");
  const response = await api.patch(`/users/${userId}`, data);
  return response.data;
};

export const deleteUser = async (userId) => {
  if (!userId) throw new Error("User ID is required.");
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export default { getUsers, getUser, createUser, updateUser, deleteUser };
