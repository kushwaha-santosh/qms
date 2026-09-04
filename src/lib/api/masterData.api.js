import api from "@/lib/api/axios.js";

/* ==========================================================
 * GET MASTER DATA TYPES
 * ========================================================== */

export const getMasterDataTypes = async () => {
  const response = await api.get("/master-data");

  return response.data;
};

/* ==========================================================
 * GET MASTER DATA
 *
 * Supports:
 * - type
 * - organizationId
 * - includeInactive
 * - search
 * - page
 * - limit
 * ========================================================== */

export const getMasterData = async (
  type,
  {
    organizationId = "",
    includeInactive = false,
    search = "",
    page = 1,
    limit = 10,
  } = {},
) => {
  const params = {
    type,
    includeInactive,
    page,
    limit,
  };

  if (organizationId) {
    params.organizationId = organizationId;
  }

  if (search?.trim()) {
    params.search = search.trim();
  }

  const response = await api.get("/master-data", {
    params,
  });

  return response.data;
};

/* ==========================================================
 * CREATE
 * ========================================================== */

export const createMasterData = async (payload) => {
  const response = await api.post("/master-data", payload);

  return response.data;
};

/* ==========================================================
 * UPDATE
 * ========================================================== */

export const updateMasterData = async (id, payload) => {
  const response = await api.put(`/master-data/${id}`, payload);

  return response.data;
};

/* ==========================================================
 * UPDATE STATUS
 * ========================================================== */

export const updateMasterDataStatus = async (id, isActive) => {
  const response = await api.patch(`/master-data/${id}/status`, {
    isActive,
  });

  return response.data;
};

/* ==========================================================
 * DELETE
 * ========================================================== */

export const deleteMasterData = async (id) => {
  const response = await api.delete(`/master-data/${id}`);

  return response.data;
};
