/**
 * Check whether a user can access an organization.
 *
 * SUPER_ADMIN can access any organization.
 *
 * Organization users can only access their own
 * organization.
 */
export const canAccessOrganization = (
  user,
  organizationId
) => {
  if (!user || !organizationId) {
    return false;
  }

  // SUPER_ADMIN is global.
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  const userOrganizationId =
    user.organizationId?._id ||
    user.organizationId ||
    null;

  if (!userOrganizationId) {
    return false;
  }

  return (
    String(userOrganizationId) ===
    String(organizationId)
  );
};

/**
 * Get the organization ID that should be used
 * for organization-scoped queries.
 *
 * SUPER_ADMIN must explicitly select an organization.
 *
 * Normal organization users automatically use
 * their own organization.
 */
export const resolveOrganizationId = (
  user,
  requestedOrganizationId = null
) => {
  if (!user) {
    return null;
  }

  // SUPER_ADMIN
  if (user.role === "SUPER_ADMIN") {
    return requestedOrganizationId
      ? String(requestedOrganizationId)
      : null;
  }

  // Organization user
  const ownOrganizationId =
    user.organizationId?._id ||
    user.organizationId ||
    null;

  return ownOrganizationId
    ? String(ownOrganizationId)
    : null;
};