import User from "@/models/User.js";

import {
  getAuthSession,
} from "./auth.js";

/**
 * Get organization ID from a user.
 *
 * SUPER_ADMIN intentionally returns null.
 */
export const getOrganizationId = (user) => {
  if (!user) {
    return null;
  }

  if (user.role === "SUPER_ADMIN") {
    return null;
  }

  return (
    user.organizationId?._id ||
    user.organizationId ||
    null
  );
};

/**
 * Determine whether the user is SUPER_ADMIN.
 */
export const isGlobalUser = (user) => {
  return user?.role === "SUPER_ADMIN";
};

/**
 * Get the currently authenticated user.
 */
export const getCurrentUser = async (request) => {
  const session = await getAuthSession(request);

  if (!session?.userId) {
    return null;
  }

  const user = await User.findById(
    session.userId
  )
    .select("-password")
    .populate({
      path: "organizationId",
      select:
        "name email phone industry status plan",
    })
    .lean();

  if (!user) {
    return null;
  }

  return user;
};