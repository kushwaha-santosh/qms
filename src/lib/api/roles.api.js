import api from "./axios";

// ==========================================================
// ROLES API
// ==========================================================

// ==========================================================
// GET ROLES
// ==========================================================

export const getRoles = async ({
  page = 1,
  limit = 20,
  search = "",
  scope = "",
  isActive = "",
  organizationId = "",
} = {}) => {
  const params = {
    page,
    limit,
    search: String(search || "").trim(),
  };

  if (scope) {
    params.scope = scope;
  }

  if (isActive !== "") {
    params.isActive = isActive;
  }

  if (organizationId) {
    params.organizationId = organizationId;
  }

  const response = await api.get("/roles", {
    params,
  });

  return response.data;
};

// ==========================================================
// GET SINGLE ROLE
// ==========================================================

export const getRole = async (roleId) => {
  if (!roleId) {
    throw new Error("Role ID is required.");
  }

  const response = await api.get(`/roles/${roleId}`);

  return response.data;
};

// ==========================================================
// CREATE ROLE
// ==========================================================

export const createRole = async (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Role data is required.");
  }

  const response = await api.post("/roles", data);

  return response.data;
};

// ==========================================================
// UPDATE ROLE
// ==========================================================

export const updateRole = async (roleId, data) => {
  if (!roleId) {
    throw new Error("Role ID is required.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Role data is required.");
  }

  const response = await api.patch(`/roles/${roleId}`, data);

  return response.data;
};

// ==========================================================
// UPDATE ROLE STATUS
// ==========================================================
//
// Status is updated through:
//
// PATCH /roles/:roleId
//
// Body:
//
// {
//   isActive: true | false
// }
//
// ==========================================================

export const updateRoleStatus = async (roleId, isActive) => {
  if (!roleId) {
    throw new Error("Role ID is required.");
  }

  if (typeof isActive !== "boolean") {
    throw new Error("isActive must be a boolean.");
  }

  const response = await api.patch(`/roles/${roleId}`, {
    isActive,
  });

  return response.data;
};

// ==========================================================
// DELETE ROLE
// ==========================================================

export const deleteRole = async (roleId) => {
  if (!roleId) {
    throw new Error("Role ID is required.");
  }

  const response = await api.delete(`/roles/${roleId}`);

  return response.data;
};
