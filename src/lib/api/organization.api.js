import api from "./axios";

/* ==========================================================
 * ORGANIZATION API
 * ========================================================== */

/**
 * List organizations.
 *
 * SUPER_ADMIN only.
 *
 * Optional filters:
 * {
 *   status: "ACTIVE" | "INACTIVE" | ...
 * }
 */
export const getOrganizations = async (params = {}) => {
  const response = await api.get("/organizations", { params });
  const data = response?.data?.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.organizations)) {
    return data.organizations;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(response?.data?.organizations)) {
    return response.data.organizations;
  }
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }
  return [];
};
/**
 * Get one organization.
 */
export const getOrganization = async (organizationId) => {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  const response = await api.get(`/organizations/${organizationId}`);

  return (
    response?.data?.data?.organization || response?.data?.data || response?.data
  );
};

/* ==========================================================
 * GET ORGANIZATION BY ID
 * ========================================================== */

export const getOrganizationById = async (organizationId) => {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  return api.get(`/organizations/${organizationId}`);
};

/**
 * Create organization
 * + first ORG_ADMIN.
 */
export const createOrganization = async (data) => {
  const response = await api.post("/organizations", data);

  return response.data;
};

/**
 * Update organization.
 */
export const updateOrganization = async (organizationId, data) => {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  const response = await api.patch(`/organizations/${organizationId}`, data);

  return response.data;
};

/**
 * Update organization status.
 */
export const updateOrganizationStatus = async (organizationId, status) => {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  if (!status) {
    throw new Error("Organization status is required.");
  }

  const response = await api.patch(`/organizations/${organizationId}`, {
    status,
  });

  return response.data;
};
