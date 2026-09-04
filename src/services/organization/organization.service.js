
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Organization from "@/models/Organization.js";
import User from "@/models/User.js";

import {
  canAccessOrganization,
} from "@/lib/auth/organization.js";

import {
  createAuditLogFromUser,
} from "@/services/auditLog/auditLog.service.js";

/* ==========================================================
 * CONSTANTS
 * ========================================================== */

const ALLOWED_PLANS = [
  "FREE",
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
];

const ALLOWED_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

/* ==========================================================
 * HELPERS
 * ========================================================== */

const createError = (
  message,
  statusCode = 500
) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const validateObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

/* ==========================================================
 * LIST ORGANIZATIONS
 * ========================================================== */

/**
 * List organizations.
 *
 * SUPER_ADMIN:
 *   Returns all organizations.
 *
 * ORG_ADMIN:
 *   Returns only their own organization.
 *
 * Other roles:
 *   Not allowed.
 */
export const listOrganizations = async ({
  user,
} = {}) => {
  /* --------------------------------------------------------
   * SUPER ADMIN
   * -------------------------------------------------------- */

  if (user?.role === "SUPER_ADMIN") {
    return Organization.find({})
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  /* --------------------------------------------------------
   * ORGANIZATION ADMIN
   * -------------------------------------------------------- */

  if (user?.role === "ORG_ADMIN") {
    const organizationId =
      user?.organizationId?._id ||
      user?.organizationId ||
      null;

    if (!organizationId) {
      throw createError(
        "Organization is not configured for this user.",
        403
      );
    }

    const organization =
      await Organization.findById(
        organizationId
      ).lean();

    if (!organization) {
      throw createError(
        "Organization not found.",
        404
      );
    }

    return [organization];
  }

  /* --------------------------------------------------------
   * OTHER ROLES
   * -------------------------------------------------------- */

  throw createError(
    "You do not have permission to view organizations.",
    403
  );
};

/* ==========================================================
 * GET ORGANIZATION
 * ========================================================== */

/**
 * SUPER_ADMIN:
 *   Can access any organization.
 *
 * Organization user:
 *   Can access only their own organization.
 */
export const getOrganization = async ({
  user,
  organizationId,
}) => {
  if (!validateObjectId(organizationId)) {
    throw createError(
      "Invalid organization ID.",
      400
    );
  }

  if (
    !canAccessOrganization(
      user,
      organizationId
    )
  ) {
    throw createError(
      "You do not have access to this organization.",
      403
    );
  }

  const organization =
    await Organization.findById(
      organizationId
    ).lean();

  if (!organization) {
    throw createError(
      "Organization not found.",
      404
    );
  }

  return organization;
};

/* ==========================================================
 * CREATE ORGANIZATION
 * ========================================================== */

/**
 * SUPER_ADMIN only.
 *
 * Creates:
 *
 * 1. Organization
 * 2. First ORG_ADMIN
 *
 * Both records are created inside one MongoDB transaction.
 *
 * After successful transaction commit:
 *
 * 3. Creates ORGANIZATION / CREATE audit log.
 */
export const createOrganization = async ({
  user,
  data,
  request = null,
}) => {
  /* --------------------------------------------------------
   * AUTHORIZATION
   * -------------------------------------------------------- */

  if (user?.role !== "SUPER_ADMIN") {
    throw createError(
      "Only SUPER_ADMIN can create organizations.",
      403
    );
  }

  /* --------------------------------------------------------
   * ORGANIZATION
   * -------------------------------------------------------- */

  const name = String(
    data?.name || ""
  ).trim();

  const email = normalizeEmail(
    data?.email
  );

  const phone = String(
    data?.phone || ""
  ).trim();

  const industry = String(
    data?.industry || ""
  ).trim();

  const plan =
    data?.plan || "FREE";

  const status =
    data?.status || "ACTIVE";

  /* --------------------------------------------------------
   * FIRST ORG ADMIN
   * -------------------------------------------------------- */

  const admin =
    data?.admin || {};

  const firstName = String(
    admin.firstName || ""
  ).trim();

  const lastName = String(
    admin.lastName || ""
  ).trim();

  const adminEmail =
    normalizeEmail(
      admin.email
    );

  const password = String(
    admin.password || ""
  );

  /* --------------------------------------------------------
   * VALIDATION
   * -------------------------------------------------------- */

  if (!name) {
    throw createError(
      "Organization name is required.",
      400
    );
  }

  if (!email) {
    throw createError(
      "Organization email is required.",
      400
    );
  }

  if (!firstName) {
    throw createError(
      "First admin first name is required.",
      400
    );
  }

  if (!adminEmail) {
    throw createError(
      "First admin email is required.",
      400
    );
  }

  if (!password) {
    throw createError(
      "First admin password is required.",
      400
    );
  }

  if (password.length < 8) {
    throw createError(
      "First admin password must be at least 8 characters.",
      400
    );
  }

  if (!ALLOWED_PLANS.includes(plan)) {
    throw createError(
      "Invalid organization plan.",
      400
    );
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createError(
      "Invalid organization status.",
      400
    );
  }

  /* --------------------------------------------------------
   * DUPLICATE CHECK
   * -------------------------------------------------------- */

  const [
    existingOrganization,
    existingUser,
  ] = await Promise.all([
    Organization.findOne({
      email,
    }).lean(),

    User.findOne({
      email: adminEmail,
    }).lean(),
  ]);

  if (existingOrganization) {
    throw createError(
      "An organization with this email already exists.",
      409
    );
  }

  if (existingUser) {
    throw createError(
      "A user with this email already exists.",
      409
    );
  }

  /* --------------------------------------------------------
   * PASSWORD HASH
   * -------------------------------------------------------- */

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  /* --------------------------------------------------------
   * TRANSACTION
   * -------------------------------------------------------- */

  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    /* ------------------------------------------------------
     * CREATE ORGANIZATION
     * ------------------------------------------------------ */

    const organizations =
      await Organization.create(
        [
          {
            name,
            email,
            phone,
            industry,
            plan,
            status,
          },
        ],
        {
          session,
        }
      );

    const organization =
      organizations[0];

    /* ------------------------------------------------------
     * CREATE FIRST ORG ADMIN
     * ------------------------------------------------------ */

    const users =
      await User.create(
        [
          {
            organizationId:
              organization._id,

            firstName,

            lastName,

            email:
              adminEmail,

            password:
              passwordHash,

            role:
              "ORG_ADMIN",

            status:
              "ACTIVE",

            passwordChangedAt:
              new Date(),

            createdBy:
              user?._id || null,
          },
        ],
        {
          session,
        }
      );

    const organizationAdmin =
      users[0];

    /* ------------------------------------------------------
     * COMMIT TRANSACTION
     * ------------------------------------------------------ */

    await session.commitTransaction();

    /* ------------------------------------------------------
     * AUDIT LOG
     *
     * IMPORTANT:
     * Audit is created AFTER successful commit.
     *
     * We intentionally do not include the admin password.
     * ------------------------------------------------------ */

    await createAuditLogFromUser({
      user,
      request,

      action:
        "CREATE",

      module:
        "ORGANIZATION",

      recordId:
        organization._id,

      description:
        `Organization "${organization.name}" was created.`,

      oldData:
        null,

      newData: {
        _id:
          organization._id,

        name:
          organization.name,

        email:
          organization.email,

        phone:
          organization.phone,

        industry:
          organization.industry,

        plan:
          organization.plan,

        status:
          organization.status,
      },
    });

    /* ------------------------------------------------------
     * SAFE RESPONSE
     * ------------------------------------------------------ */

    const safeUser =
      organizationAdmin.toObject();

    delete safeUser.password;

    return {
      organization:
        organization.toObject(),

      user:
        safeUser,
    };
  } catch (error) {
    /* ------------------------------------------------------
     * ABORT TRANSACTION
     * ------------------------------------------------------ */

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error?.code === 11000) {
      throw createError(
        "An organization or user with the supplied email already exists.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

/* ==========================================================
 * UPDATE ORGANIZATION
 * ========================================================== */

/**
 * Update organization.
 *
 * SUPER_ADMIN:
 *   Can update any organization.
 *
 * ORG_ADMIN:
 *   Can update only their own organization.
 *
 * Fields:
 *   name
 *   email
 *   phone
 *   industry
 *   plan
 *   status
 *   address
 *   settings
 *
 * Audit:
 *   UPDATE
 *   STATUS_UPDATE
 */
export const updateOrganization = async ({
  user,
  organizationId,
  data,
  request = null,
}) => {
  /* --------------------------------------------------------
   * VALIDATE ORGANIZATION ID
   * -------------------------------------------------------- */

  if (!validateObjectId(organizationId)) {
    throw createError(
      "Invalid organization ID.",
      400
    );
  }

  /* --------------------------------------------------------
   * AUTHORIZATION
   * -------------------------------------------------------- */

  if (
    !canAccessOrganization(
      user,
      organizationId
    )
  ) {
    throw createError(
      "You do not have access to this organization.",
      403
    );
  }

  /* --------------------------------------------------------
   * LOAD OLD ORGANIZATION
   *
   * This must happen BEFORE the update so that
   * the audit log can contain the previous state.
   * -------------------------------------------------------- */

  const oldOrganization =
    await Organization.findById(
      organizationId
    ).lean();

  if (!oldOrganization) {
    throw createError(
      "Organization not found.",
      404
    );
  }

  /* --------------------------------------------------------
   * UPDATE OBJECT
   * -------------------------------------------------------- */

  const update = {};

  /* --------------------------------------------------------
   * BASIC INFORMATION
   * -------------------------------------------------------- */

  if (data?.name !== undefined) {
    const name = String(
      data.name || ""
    ).trim();

    if (!name) {
      throw createError(
        "Organization name is required.",
        400
      );
    }

    update.name = name;
  }

  if (data?.email !== undefined) {
    const email =
      normalizeEmail(
        data.email
      );

    if (!email) {
      throw createError(
        "Organization email is required.",
        400
      );
    }

    update.email = email;
  }

  if (data?.phone !== undefined) {
    update.phone =
      String(
        data.phone || ""
      ).trim();
  }

  if (data?.industry !== undefined) {
    update.industry =
      String(
        data.industry || ""
      ).trim();
  }

  /* --------------------------------------------------------
   * PLAN
   *
   * Only SUPER_ADMIN can change organization plan.
   * -------------------------------------------------------- */

  if (
    data?.plan !== undefined &&
    user?.role === "SUPER_ADMIN"
  ) {
    if (
      !ALLOWED_PLANS.includes(
        data.plan
      )
    ) {
      throw createError(
        "Invalid organization plan.",
        400
      );
    }

    update.plan =
      data.plan;
  }

  /* --------------------------------------------------------
   * STATUS
   *
   * SUPER_ADMIN and ORG_ADMIN can change
   * status of an organization they are
   * authorized to manage.
   * -------------------------------------------------------- */

  if (data?.status !== undefined) {
    if (
      !ALLOWED_STATUSES.includes(
        data.status
      )
    ) {
      throw createError(
        "Invalid organization status.",
        400
      );
    }

    update.status =
      data.status;
  }

  /* --------------------------------------------------------
   * ADDRESS
   * -------------------------------------------------------- */

  if (data?.address !== undefined) {
    const address =
      data.address || {};

    update.address = {
      addressLine1:
        String(
          address.addressLine1 ||
            ""
        ).trim(),

      addressLine2:
        String(
          address.addressLine2 ||
            ""
        ).trim(),

      city:
        String(
          address.city || ""
        ).trim(),

      state:
        String(
          address.state || ""
        ).trim(),

      country:
        String(
          address.country ||
            "India"
        ).trim(),

      postalCode:
        String(
          address.postalCode ||
            ""
        ).trim(),
    };
  }

  /* --------------------------------------------------------
   * SETTINGS
   * -------------------------------------------------------- */

  if (data?.settings !== undefined) {
    const settings =
      data.settings || {};

    update.settings = {
      timezone:
        String(
          settings.timezone ||
            "Asia/Kolkata"
        ).trim(),

      dateFormat:
        String(
          settings.dateFormat ||
            "DD-MM-YYYY"
        ).trim(),

      currency:
        String(
          settings.currency ||
            "INR"
        ).trim(),
    };
  }

  /* --------------------------------------------------------
   * NOTHING TO UPDATE
   * -------------------------------------------------------- */

  if (
    Object.keys(update).length === 0
  ) {
    throw createError(
      "No valid organization fields were provided for update.",
      400
    );
  }

  /* --------------------------------------------------------
   * DUPLICATE EMAIL CHECK
   * -------------------------------------------------------- */

  if (update.email) {
    const existingOrganization =
      await Organization.findOne({
        email:
          update.email,

        _id: {
          $ne:
            organizationId,
        },
      }).lean();

    if (existingOrganization) {
      throw createError(
        "An organization with this email already exists.",
        409
      );
    }
  }

  /* --------------------------------------------------------
   * DETERMINE AUDIT ACTION
   *
   * If status is the ONLY changed field:
   *
   *   STATUS_UPDATE
   *
   * Otherwise:
   *
   *   UPDATE
   * -------------------------------------------------------- */

  const changedFields =
    Object.keys(update);

  const isOnlyStatusUpdate =
    changedFields.length === 1 &&
    changedFields[0] === "status";

  const auditAction =
    isOnlyStatusUpdate
      ? "STATUS_UPDATE"
      : "UPDATE";

  /* --------------------------------------------------------
   * UPDATE DATABASE
   * -------------------------------------------------------- */

  const organization =
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set:
          update,
      },
      {
        returnDocument:
          "after",

        runValidators:
          true,
      }
    ).lean();

  /* --------------------------------------------------------
   * NOT FOUND
   * -------------------------------------------------------- */

  if (!organization) {
    throw createError(
      "Organization not found.",
      404
    );
  }

  /* --------------------------------------------------------
   * AUDIT DESCRIPTION
   * -------------------------------------------------------- */

  let auditDescription;

  if (isOnlyStatusUpdate) {
    auditDescription =
      `Organization "${organization.name}" status changed from "${oldOrganization.status}" to "${organization.status}".`;
  } else {
    auditDescription =
      `Organization "${organization.name}" was updated.`;
  }

  /* --------------------------------------------------------
   * AUDIT LOG
   *
   * oldData:
   *   Organization BEFORE update
   *
   * newData:
   *   Organization AFTER update
   *
   * Sensitive fields are sanitized by
   * auditLog.service.js.
   * -------------------------------------------------------- */

  await createAuditLogFromUser({
    user,
    request,

    action:
      auditAction,

    module:
      "ORGANIZATION",

    recordId:
      organization._id,

    description:
      auditDescription,

    oldData:
      oldOrganization,

    newData:
      organization,
  });

  /* --------------------------------------------------------
   * RETURN UPDATED ORGANIZATION
   * -------------------------------------------------------- */

  return organization;
};

/* ==========================================================
 * CHANGE ORGANIZATION STATUS
 * ========================================================== */

/**
 * Change organization status.
 *
 * SUPER_ADMIN:
 *   Can change any organization's status.
 *
 * ORG_ADMIN:
 *   Can change only their own organization's status.
 *
 * Other organization users:
 *   Not allowed.
 *
 * Audit:
 *   STATUS_UPDATE
 */
export const updateOrganizationStatus = async ({
  user,
  organizationId,
  status,
  request = null,
}) => {
  /* --------------------------------------------------------
   * VALIDATE ORGANIZATION ID
   * -------------------------------------------------------- */

  if (!validateObjectId(organizationId)) {
    throw createError(
      "Invalid organization ID.",
      400
    );
  }

  /* --------------------------------------------------------
   * AUTHORIZATION
   *
   * SUPER_ADMIN can manage any organization.
   *
   * ORG_ADMIN can manage only their own organization.
   * -------------------------------------------------------- */

  if (user?.role !== "SUPER_ADMIN") {
    if (user?.role !== "ORG_ADMIN") {
      throw createError(
        "You do not have permission to change organization status.",
        403
      );
    }

    if (
      !canAccessOrganization(
        user,
        organizationId
      )
    ) {
      throw createError(
        "You do not have access to this organization.",
        403
      );
    }
  }

  /* --------------------------------------------------------
   * VALIDATE STATUS
   * -------------------------------------------------------- */

  if (
    !ALLOWED_STATUSES.includes(
      status
    )
  ) {
    throw createError(
      "Invalid organization status.",
      400
    );
  }

  /* --------------------------------------------------------
   * LOAD OLD ORGANIZATION
   *
   * Required for audit comparison.
   * -------------------------------------------------------- */

  const oldOrganization =
    await Organization.findById(
      organizationId
    ).lean();

  if (!oldOrganization) {
    throw createError(
      "Organization not found.",
      404
    );
  }

  /* --------------------------------------------------------
   * NO CHANGE
   *
   * Do not create an audit record if
   * the status is already the requested status.
   * -------------------------------------------------------- */

  if (
    oldOrganization.status ===
    status
  ) {
    return oldOrganization;
  }

  /* --------------------------------------------------------
   * UPDATE
   * -------------------------------------------------------- */

  const organization =
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set: {
          status,
        },
      },
      {
        returnDocument:
          "after",

        runValidators:
          true,
      }
    ).lean();

  /* --------------------------------------------------------
   * NOT FOUND
   * -------------------------------------------------------- */

  if (!organization) {
    throw createError(
      "Organization not found.",
      404
    );
  }

  /* --------------------------------------------------------
   * AUDIT LOG
   * -------------------------------------------------------- */

  await createAuditLogFromUser({
    user,
    request,

    action:
      "STATUS_UPDATE",

    module:
      "ORGANIZATION",

    recordId:
      organization._id,

    description:
      `Organization "${organization.name}" status changed from "${oldOrganization.status}" to "${organization.status}".`,

    oldData:
      oldOrganization,

    newData:
      organization,
  });

  /* --------------------------------------------------------
   * RETURN UPDATED ORGANIZATION
   * -------------------------------------------------------- */

  return organization;
};

