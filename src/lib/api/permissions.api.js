import api from "./axios";

// ==========================================================
// LIST
// ==========================================================

export const getPermissions =
  async ({
    search = "",
    module = "",
    action = "",
    isActive = "",
  } = {}) => {
    const response =
      await api.get(
        "/permissions",
        {
          params: {
            search:
              search.trim(),
            module:
              module.trim(),
            action:
              action.trim(),
            isActive,
          },
        }
      );

    return response.data;
  };

// ==========================================================
// GET
// ==========================================================

export const getPermission =
  async (
    permissionId
  ) => {
    if (!permissionId) {
      throw new Error(
        "Permission ID is required."
      );
    }

    const response =
      await api.get(
        `/permissions/${permissionId}`
      );

    return response.data;
  };

// ==========================================================
// CREATE
// ==========================================================

export const createPermission =
  async (data) => {
    const response =
      await api.post(
        "/permissions",
        data
      );

    return response.data;
  };

// ==========================================================
// UPDATE
// ==========================================================

export const updatePermission =
  async (
    permissionId,
    data
  ) => {
    if (!permissionId) {
      throw new Error(
        "Permission ID is required."
      );
    }

    const response =
      await api.patch(
        `/permissions/${permissionId}`,
        data
      );

    return response.data;
  };

// ==========================================================
// STATUS
// ==========================================================

export const updatePermissionStatus =
  async (
    permissionId,
    isActive
  ) => {
    if (!permissionId) {
      throw new Error(
        "Permission ID is required."
      );
    }

    const response =
      await api.patch(
        `/permissions/${permissionId}`,
        {
          isActive,
        }
      );

    return response.data;
  };

// ==========================================================
// DELETE
// ==========================================================

export const deletePermission =
  async (
    permissionId
  ) => {
    if (!permissionId) {
      throw new Error(
        "Permission ID is required."
      );
    }

    const response =
      await api.delete(
        `/permissions/${permissionId}`
      );

    return response.data;
  };