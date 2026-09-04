"use client";

import { useAuth } from "@/context/AuthProvider";

// ==========================================================
// FORMAT ROLE NAME
// ==========================================================

const formatRoleName = (value) => {
  if (!value) {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==========================================================
// GET PERMISSION KEY
// ==========================================================

const getPermissionKey = (permission) => {
  if (typeof permission === "string") {
    return permission;
  }

  return permission?.key || permission?.code || "";
};

// ==========================================================
// ROLE TABLE
// ==========================================================

export default function RoleTable({
  roles = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const { user, hasPermission } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // ========================================================
  // EFFECTIVE PERMISSIONS
  // ========================================================

  const effectiveCanUpdate =
    isSuperAdmin || canUpdate || hasPermission?.("ROLE_UPDATE") === true;

  const effectiveCanDelete =
    !isSuperAdmin && (canDelete || hasPermission?.("ROLE_DELETE") === true);

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex items-center gap-4 px-6 py-5">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

            <div className="hidden h-4 w-48 animate-pulse rounded bg-gray-200 md:block" />

            <div className="hidden h-4 w-24 animate-pulse rounded bg-gray-200 sm:block" />

            <div className="ml-auto h-8 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // ========================================================
  // EMPTY
  // ========================================================

  if (!Array.isArray(roles) || roles.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 6v12m6-6H6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          No roles found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          There are no roles matching the current filters.
        </p>
      </div>
    );
  }

  // ========================================================
  // TABLE
  // ========================================================

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Role
            </th>

            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Description
            </th>

            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Scope
            </th>

            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Permissions
            </th>

            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Status
            </th>

            {effectiveCanUpdate || effectiveCanDelete ? (
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Actions
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {roles.map((role) => {
            const permissions = Array.isArray(role?.permissions)
              ? role.permissions
              : [];

            const isSystemRole = role?.scope === "SYSTEM";

            const isSuperAdminRole = role?.name === "SUPER_ADMIN";

            // IMPORTANT:
            // Only explicit false means inactive.
            // undefined/null/missing is ACTIVE.
            const isActive = role?.isActive !== false;

            const canUpdateThisRole =
              effectiveCanUpdate &&
              Boolean(onEdit) &&
              (!isSystemRole || !isSuperAdmin);

            const canDeleteThisRole =
              effectiveCanDelete && Boolean(onDelete) && !isSystemRole;

            return (
              <tr
                key={role?._id || role?.id || role?.name}
                className="hover:bg-gray-50"
              >
                {/* ==================================================
                    ROLE
                ================================================== */}

                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {role?.displayName || formatRoleName(role?.name)}
                      </span>

                      {isSystemRole ? (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                          System
                        </span>
                      ) : null}

                      {isSuperAdminRole ? (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                          Global
                        </span>
                      ) : null}
                    </div>

                    {role?.name ? (
                      <span className="text-xs text-gray-400">{role.name}</span>
                    ) : null}
                  </div>
                </td>

                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <td className="max-w-xs px-6 py-4 align-top">
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {role?.description || "No description provided."}
                  </p>
                </td>

                {/* ==================================================
                    SCOPE
                ================================================== */}

                <td className="px-6 py-4 align-top">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      role?.scope === "SYSTEM"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {role?.scope || "ORGANIZATION"}
                  </span>
                </td>

                {/* ==================================================
                    PERMISSIONS
                ================================================== */}

                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {permissions.length}
                    </span>

                    {permissions.length > 0 ? (
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {permissions.slice(0, 3).map((permission, index) => {
                          const key = getPermissionKey(permission);

                          return (
                            <span
                              key={`${key}-${index}`}
                              className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600"
                            >
                              {formatRoleName(key)}
                            </span>
                          );
                        })}

                        {permissions.length > 3 ? (
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">
                            +{permissions.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No permissions
                      </span>
                    )}
                  </div>
                </td>

                {/* ==================================================
                    STATUS
                ================================================== */}

                <td className="px-6 py-4 align-top">
                  {canUpdateThisRole ? (
                    <select
                      value={isActive ? "ACTIVE" : "INACTIVE"}
                      onChange={(event) => {
                        onStatusChange?.(role, event.target.value === "ACTIVE");
                      }}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-gray-300 ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      aria-label={`Change status for ${
                        role?.displayName || role?.name || "role"
                      }`}
                    >
                      <option value="ACTIVE">Active</option>

                      <option value="INACTIVE">Inactive</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />

                      {isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                {effectiveCanUpdate || effectiveCanDelete ? (
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      {canUpdateThisRole ? (
                        <button
                          type="button"
                          onClick={() => onEdit?.(role)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      ) : null}

                      {canDeleteThisRole ? (
                        <button
                          type="button"
                          onClick={() => onDelete?.(role)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      ) : null}

                      {!canUpdateThisRole && !canDeleteThisRole ? (
                        <span className="px-2 py-2 text-xs text-gray-400">
                          Protected
                        </span>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
