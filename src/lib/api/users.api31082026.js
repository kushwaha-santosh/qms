import api from "./axios";

/**
 * ==========================================================
 * USERS API
 * ==========================================================
 */


/**
 * List users.
 */
export const getUsers = async ({
  page = 1,
  limit = 20,
  search = "",
  role = "",
  status = "",
} = {}) => {
  const response = await api.get(
    "/users",
    {
      params: {
        page,
        limit,
        search: search.trim(),
        role,
        status,
      },
    }
  );

  return response.data;
};


/**
 * Get one user.
 */
export const getUser = async (
  userId
) => {
  const response = await api.get(
    `/users/${userId}`
  );

  return response.data;
};


/**
 * Create user.
 *
 * SUPER_ADMIN may provide organizationId.
 *
 * ORG_ADMIN should NOT provide organizationId.
 * The backend automatically uses the authenticated
 * user's organization.
 */
export const createUser = async (
  data
) => {
  const response = await api.post(
    "/users",
    data
  );

  return response.data;
};


/**
 * Update user.
 */
export const updateUser = async (
  userId,
  data
) => {
  const response = await api.patch(
    `/users/${userId}`,
    data
  );

  return response.data;
};


/**
 * Delete user.
 */
export const deleteUser = async (
  userId
) => {
  const response = await api.delete(
    `/users/${userId}`
  );

  return response.data;
};