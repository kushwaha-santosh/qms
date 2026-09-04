import mongoose from "mongoose";

import AuditLog from "@/models/AuditLog.js";
import User from "@/models/User.js";

// ==========================================================
// DEFAULTS
// ==========================================================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ==========================================================
// SENSITIVE FIELDS
// ==========================================================

const SENSITIVE_FIELDS = new Set([
  // Authentication
  "password",
  "currentPassword",
  "newPassword",

  // Tokens
  "token",
  "accessToken",
  "refreshToken",
  "authorization",

  // Password reset
  "passwordToken",
  "passwordResetToken",
  "passwordResetExpires",
  "resetToken",
  "resetPasswordToken",

  // Secrets
  "secret",
  "clientSecret",
  "apiKey",
  "privateKey",

  // OTP / verification
  "otp",
  "otpCode",
  "verificationCode",

  // HTTP credentials
  "cookie",
  "cookies",

  // Mongoose internal version
  "__v",
]);

// ==========================================================
// STRING NORMALIZATION
// ==========================================================

const normalizeString = (
  value,
  fallback = ""
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
};

// ==========================================================
// OBJECT ID NORMALIZATION
// ==========================================================

const normalizeObjectId = (
  value
) => {
  if (!value) {
    return null;
  }

  if (
    value instanceof
    mongoose.Types.ObjectId
  ) {
    return value;
  }

  if (
    mongoose.Types.ObjectId.isValid(
      value
    )
  ) {
    return new mongoose.Types.ObjectId(
      value
    );
  }

  return value;
};

// ==========================================================
// REQUEST METADATA
// ==========================================================
//
// Use this from Next.js route handlers:
//
// const metadata = getRequestMetadata(request);
//
// await createAuditLog({
//   ...metadata,
// });
//
// ==========================================================

export const getRequestMetadata = (
  request
) => {
  if (!request) {
    return {
      ipAddress: "",
      userAgent: "",
    };
  }

  const forwardedFor =
    request.headers?.get(
      "x-forwarded-for"
    );

  const realIp =
    request.headers?.get(
      "x-real-ip"
    );

  const ipAddress =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    realIp ||
    "";

  const userAgent =
    request.headers?.get(
      "user-agent"
    ) || "";

  return {
    ipAddress,
    userAgent,
  };
};

// ==========================================================
// AUDIT ACTOR CONTEXT
// ==========================================================
//
// Converts authenticated user information into the standard
// context expected by createAuditLog().
//
// ==========================================================

export const getAuditActorContext = (
  user
) => {
  if (!user) {
    return {
      userId: null,
      organizationId: null,
      isSuperAdmin: false,
      userName: "System",
      userEmail: "",
    };
  }

  const firstName =
    user.firstName || "";

  const lastName =
    user.lastName || "";

  const composedName =
    `${firstName} ${lastName}`.trim();

  const userName =
    composedName ||
    user.name ||
    user.fullName ||
    user.email ||
    "System";

  const isSuperAdmin =
    user.role === "SUPER_ADMIN";

  return {
    userId: user._id || null,

    organizationId:
      isSuperAdmin
        ? null
        : user.organizationId || null,

    isSuperAdmin,

    userName,

    userEmail:
      user.email || "",
  };
};

// ==========================================================
// CREATE AUDIT LOG FROM AUTHENTICATED USER
// ==========================================================

export const createAuditLogFromUser = async ({
  user,
  action,
  module,
  recordId = null,
  description = "",
  oldData = null,
  newData = null,
  request = null,
} = {}) => {
  const actor =
    getAuditActorContext(user);

  const metadata =
    getRequestMetadata(request);

  return createAuditLog({
    organizationId:
      actor.organizationId,

    userId:
      actor.userId,

    userName:
      actor.userName,

    userEmail:
      actor.userEmail,

    action,
    module,

    recordId,

    description,

    oldData,
    newData,

    ipAddress:
      metadata.ipAddress,

    userAgent:
      metadata.userAgent,
  });
};

// ==========================================================
// SANITIZE AUDIT DATA
// ==========================================================

export const sanitizeAuditData = (
  value,
  seen = new WeakSet()
) => {
  // --------------------------------------------------------
  // NULL / UNDEFINED
  // --------------------------------------------------------

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  // --------------------------------------------------------
  // PRIMITIVES
  // --------------------------------------------------------

  if (
    typeof value !== "object"
  ) {
    return value;
  }

  // --------------------------------------------------------
  // OBJECT ID
  // --------------------------------------------------------

  if (
    value instanceof
    mongoose.Types.ObjectId
  ) {
    return value;
  }

  // --------------------------------------------------------
  // DATE
  // --------------------------------------------------------

  if (value instanceof Date) {
    return value;
  }

  // --------------------------------------------------------
  // CIRCULAR REFERENCE PROTECTION
  // --------------------------------------------------------

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  // --------------------------------------------------------
  // ARRAY
  // --------------------------------------------------------

  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        sanitizeAuditData(
          item,
          seen
        )
    );
  }

  // --------------------------------------------------------
  // MONGOOSE DOCUMENT
  // --------------------------------------------------------

  let source = value;

  if (
    typeof value.toObject ===
    "function"
  ) {
    source = value.toObject({
      depopulate: true,
      getters: false,
      virtuals: false,
    });
  }

  // --------------------------------------------------------
  // OBJECT
  // --------------------------------------------------------

  const sanitized = {};

  for (const [
    key,
    item,
  ] of Object.entries(source)) {
    if (
      SENSITIVE_FIELDS.has(key)
    ) {
      continue;
    }

    const normalizedKey =
      String(key).toLowerCase();

    if (
      normalizedKey.includes(
        "password"
      )
    ) {
      continue;
    }

    if (
      normalizedKey.includes(
        "secret"
      )
    ) {
      continue;
    }

    if (
      normalizedKey.includes(
        "accesstoken"
      )
    ) {
      continue;
    }

    if (
      normalizedKey.includes(
        "refreshtoken"
      )
    ) {
      continue;
    }

    if (
      normalizedKey.includes(
        "privatekey"
      )
    ) {
      continue;
    }

    sanitized[key] =
      sanitizeAuditData(
        item,
        seen
      );
  }

  return sanitized;
};

// ==========================================================
// GET USER SNAPSHOT
// ==========================================================

const getUserSnapshot = async (
  userId
) => {
  if (!userId) {
    return {
      userName: "System",
      userEmail: "",
    };
  }

  try {
    const user =
      await User.findById(
        userId
      )
        .select(
          "firstName lastName name fullName email"
        )
        .lean();

    if (!user) {
      return {
        userName: "System",
        userEmail: "",
      };
    }

    const firstName =
      user.firstName || "";

    const lastName =
      user.lastName || "";

    const composedName =
      `${firstName} ${lastName}`
        .trim();

    const userName =
      composedName ||
      user.name ||
      user.fullName ||
      user.email ||
      "System";

    return {
      userName,
      userEmail:
        user.email || "",
    };
  } catch (error) {
    console.error(
      "Audit log user lookup error:",
      error
    );

    return {
      userName: "System",
      userEmail: "",
    };
  }
};

// ==========================================================
// CREATE AUDIT LOG
// ==========================================================

export const createAuditLog =
  async ({
    organizationId = null,
    userId = null,

    action,
    module,

    recordId = null,

    description = "",

    oldData = null,
    newData = null,

    ipAddress = "",
    userAgent = "",

    userName = "",
    userEmail = "",
  } = {}) => {
    try {
      // ----------------------------------------------------
      // ACTION
      // ----------------------------------------------------

      const normalizedAction =
        normalizeString(
          action
        ).toUpperCase();

      if (!normalizedAction) {
        console.error(
          "Audit log skipped: action is required."
        );

        return null;
      }

      // ----------------------------------------------------
      // MODULE
      // ----------------------------------------------------

      const normalizedModule =
        normalizeString(
          module
        ).toUpperCase();

      if (!normalizedModule) {
        console.error(
          "Audit log skipped: module is required."
        );

        return null;
      }

      // ----------------------------------------------------
      // DESCRIPTION
      // ----------------------------------------------------

      const normalizedDescription =
        normalizeString(
          description
        );

      if (!normalizedDescription) {
        console.error(
          "Audit log skipped: description is required."
        );

        return null;
      }

      // ----------------------------------------------------
      // USER SNAPSHOT
      // ----------------------------------------------------

      let resolvedUserName =
        normalizeString(
          userName
        );

      let resolvedUserEmail =
        normalizeString(
          userEmail
        );

      if (
        userId &&
        (
          !resolvedUserName ||
          !resolvedUserEmail
        )
      ) {
        const userSnapshot =
          await getUserSnapshot(
            userId
          );

        resolvedUserName =
          resolvedUserName ||
          userSnapshot.userName;

        resolvedUserEmail =
          resolvedUserEmail ||
          userSnapshot.userEmail;
      }

      if (!resolvedUserName) {
        resolvedUserName =
          "System";
      }

      // ----------------------------------------------------
      // SANITIZE OLD DATA
      // ----------------------------------------------------

      const sanitizedOldData =
        oldData === null
          ? null
          : sanitizeAuditData(
              oldData
            );

      // ----------------------------------------------------
      // SANITIZE NEW DATA
      // ----------------------------------------------------

      const sanitizedNewData =
        newData === null
          ? null
          : sanitizeAuditData(
              newData
            );

      // ----------------------------------------------------
      // CREATE AUDIT RECORD
      // ----------------------------------------------------

      const auditLog =
        await AuditLog.create({
          organizationId:
            organizationId
              ? normalizeObjectId(
                  organizationId
                )
              : null,

          userId:
            userId
              ? normalizeObjectId(
                  userId
                )
              : null,

          userName:
            resolvedUserName,

          userEmail:
            resolvedUserEmail,

          action:
            normalizedAction,

          module:
            normalizedModule,

          recordId:
            recordId
              ? normalizeObjectId(
                  recordId
                )
              : null,

          description:
            normalizedDescription,

          oldData:
            sanitizedOldData,

          newData:
            sanitizedNewData,

          ipAddress:
            normalizeString(
              ipAddress
            ),

          userAgent:
            normalizeString(
              userAgent
            ),
        });

      return auditLog;
    } catch (auditError) {
      // Audit failure must never break
      // the actual business operation.

      console.error(
        "Audit log error:",
        auditError
      );

      return null;
    }
  };

// ==========================================================
// BUILD TENANT QUERY
// ==========================================================

const buildAuditQuery = ({
  organizationId = null,
  isSuperAdmin = false,
  targetOrganizationId =
    null,
}) => {
  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  if (isSuperAdmin) {
    if (
      targetOrganizationId
    ) {
      return {
        organizationId:
          normalizeObjectId(
            targetOrganizationId
          ),
      };
    }

    // SUPER_ADMIN can see global
    // and organization audit records.

    return {};
  }

  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  if (!organizationId) {
    const error = new Error(
      "Organization information is required."
    );

    error.statusCode = 400;

    throw error;
  }

  return {
    organizationId:
      normalizeObjectId(
        organizationId
      ),
  };
};

// ==========================================================
// GET AUDIT LOGS
// ==========================================================

export const getAuditLogs =
  async ({
    organizationId = null,

    isSuperAdmin = false,

    targetOrganizationId =
      null,

    module = "",
    action = "",

    userId = "",
    recordId = "",

    search = "",

    startDate = "",
    endDate = "",

    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const query =
      buildAuditQuery({
        organizationId,
        isSuperAdmin,
        targetOrganizationId,
      });

    // ------------------------------------------------------
    // MODULE
    // ------------------------------------------------------

    if (module?.trim()) {
      query.module =
        module
          .trim()
          .toUpperCase();
    }

    // ------------------------------------------------------
    // ACTION
    // ------------------------------------------------------

    if (action?.trim()) {
      query.action =
        action
          .trim()
          .toUpperCase();
    }

    // ------------------------------------------------------
    // USER
    // ------------------------------------------------------

    if (userId?.trim()) {
      if (
        mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        query.userId =
          new mongoose.Types.ObjectId(
            userId
          );
      }
    }

    // ------------------------------------------------------
    // RECORD
    // ------------------------------------------------------

    if (recordId?.trim()) {
      if (
        mongoose.Types.ObjectId.isValid(
          recordId
        )
      ) {
        query.recordId =
          new mongoose.Types.ObjectId(
            recordId
          );
      } else {
        query.recordId =
          recordId.trim();
      }
    }

    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    if (search?.trim()) {
      const escapedSearch =
        search
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

      const searchRegex =
        new RegExp(
          escapedSearch,
          "i"
        );

      query.$or = [
        {
          description:
            searchRegex,
        },
        {
          module:
            searchRegex,
        },
        {
          action:
            searchRegex,
        },
        {
          userName:
            searchRegex,
        },
        {
          userEmail:
            searchRegex,
        },
      ];
    }

    // ------------------------------------------------------
    // DATE RANGE
    // ------------------------------------------------------

    if (
      startDate ||
      endDate
    ) {
      query.createdAt = {};

      if (startDate) {
        const start =
          new Date(startDate);

        if (
          !Number.isNaN(
            start.getTime()
          )
        ) {
          start.setHours(
            0,
            0,
            0,
            0
          );

          query.createdAt.$gte =
            start;
        }
      }

      if (endDate) {
        const end =
          new Date(endDate);

        if (
          !Number.isNaN(
            end.getTime()
          )
        ) {
          end.setHours(
            23,
            59,
            59,
            999
          );

          query.createdAt.$lte =
            end;
        }
      }

      if (
        Object.keys(
          query.createdAt
        ).length === 0
      ) {
        delete query.createdAt;
      }
    }

    // ------------------------------------------------------
    // PAGINATION
    // ------------------------------------------------------

    const currentPage =
      Math.max(
        Number(page) ||
          DEFAULT_PAGE,
        1
      );

    const currentLimit =
      Math.min(
        Math.max(
          Number(limit) ||
            DEFAULT_LIMIT,
          1
        ),
        MAX_LIMIT
      );

    const skip =
      (currentPage - 1) *
      currentLimit;

    // ------------------------------------------------------
    // DATABASE
    // ------------------------------------------------------

    const [
      auditLogs,
      total,
    ] = await Promise.all([
      AuditLog.find(query)
        .populate({
          path: "userId",
          select:
            "firstName lastName name fullName email role status",
        })
        .populate({
          path: "organizationId",
          select:
            "name code slug email",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(currentLimit)
        .lean(),

      AuditLog.countDocuments(
        query
      ),
    ]);

    return {
      auditLogs,

      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,

        totalPages:
          Math.ceil(
            total /
              currentLimit
          ) || 1,
      },
    };
  };

// ==========================================================
// GET AUDIT LOG BY ID
// ==========================================================

export const getAuditLogById =
  async ({
    auditLogId,

    organizationId = null,

    isSuperAdmin = false,
  } = {}) => {
    if (!auditLogId) {
      const error = new Error(
        "Audit log ID is required."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        auditLogId
      )
    ) {
      const error = new Error(
        "Invalid audit log ID."
      );

      error.statusCode = 400;

      throw error;
    }

    const query = {
      _id: auditLogId,
    };

    if (!isSuperAdmin) {
      if (!organizationId) {
        const error = new Error(
          "Organization information is required."
        );

        error.statusCode = 400;

        throw error;
      }

      query.organizationId =
        normalizeObjectId(
          organizationId
        );
    }

    const auditLog =
      await AuditLog.findOne(
        query
      )
        .populate({
          path: "userId",
          select:
            "firstName lastName name fullName email role status",
        })
        .populate({
          path: "organizationId",
          select:
            "name code slug email",
        })
        .lean();

    if (!auditLog) {
      const error = new Error(
        "Audit log not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return auditLog;
  };

// ==========================================================
// GET RECORD AUDIT HISTORY
// ==========================================================

export const getRecordAuditLogs =
  async ({
    recordId,

    module = "",

    organizationId = null,

    isSuperAdmin = false,

    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  } = {}) => {
    if (!recordId) {
      const error = new Error(
        "Record ID is required."
      );

      error.statusCode = 400;

      throw error;
    }

    return getAuditLogs({
      organizationId,

      isSuperAdmin,

      module,

      recordId:
        String(recordId),

      page,
      limit,
    });
  };