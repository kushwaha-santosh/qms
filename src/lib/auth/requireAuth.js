import { NextResponse } from "next/server";

import {
  getCurrentUser,
} from "./session.js";

import {
  getAuthorizationContext,
  userHasPermission,
  userHasRole,
} from "./authorization.js";

/**
 * Authenticate request.
 */
export const requireAuth = async (
  request
) => {
  const user = await getCurrentUser(
    request
  );

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "User account is not active.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    success: true,
    user,
  };
};

/**
 * Require a specific permission.
 */
export const requirePermission = async (
  request,
  permission
) => {
  const authentication =
    await requireAuth(request);

  if (!authentication.success) {
    return authentication;
  }

  const { user } = authentication;

  const {
    role,
    permissions,
  } = await getAuthorizationContext(user);

  if (!role) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "User role is not configured or inactive.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  const allowed =
    user.role === "SUPER_ADMIN" ||
    userHasPermission(
      permissions,
      permission
    );

  if (!allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to perform this action.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    success: true,
    user,
    role,
    permissions,
  };
};

/**
 * Require a specific role.
 */
export const requireRole = async (
  request,
  ...roles
) => {
  const authentication =
    await requireAuth(request);

  if (!authentication.success) {
    return authentication;
  }

  const { user } = authentication;

  const allowed =
    user.role === "SUPER_ADMIN" ||
    userHasRole(user, ...roles);

  if (!allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to access this resource.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  const {
    role,
    permissions,
  } = await getAuthorizationContext(user);

  return {
    success: true,
    user,
    role,
    permissions,
  };
};