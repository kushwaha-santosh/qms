import api from "@/lib/api/axios.js";

/*
 * ==========================================================
 * LIST
 * ==========================================================
 */

export const getLocations = async ({
  type,
  parentId = "",
  search = "",
  isActive = true,
  page = 1,
  limit = 20,
} = {}) => {
  const response = await api.get("/locations", {
    params: {
      type,
      parentId: parentId || undefined,
      search: search || undefined,
      isActive,
      page,
      limit,
    },
  });

  return response.data;
};

/*
 * ==========================================================
 * GET
 * ==========================================================
 */

export const getLocation = async (id) => {
  const response = await api.get(`/locations/${id}`);

  return response.data;
};

/*
 * ==========================================================
 * CREATE
 * ==========================================================
 */

export const createLocation = async (data) => {
  const response = await api.post("/locations", data);

  return response.data;
};

/*
 * ==========================================================
 * UPDATE
 * ==========================================================
 */

export const updateLocation = async (id, data) => {
  const response = await api.put(`/locations/${id}`, data);

  return response.data;
};

/*
 * ==========================================================
 * STATUS
 * ==========================================================
 */

export const updateLocationStatus = async (id, isActive) => {
  const response = await api.patch(`/locations/${id}/status`, {
    isActive,
  });

  return response.data;
};

/*
 * ==========================================================
 * DELETE
 * ==========================================================
 */

export const deleteLocation = async (id) => {
  const response = await api.delete(`/locations/${id}`);

  return response.data;
};
