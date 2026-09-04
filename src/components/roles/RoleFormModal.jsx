"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthProvider";

import { getPermissions } from "@/lib/api/permissions.api";

const INITIAL_FORM = {
name: "",
displayName: "",
description: "",
permissions: [],
isActive: true,
};

const SYSTEM_ROLE_NAMES = [
"SUPER_ADMIN",
];

const ROLE_NAMES = [
"ORG_ADMIN",
"QUALITY_MANAGER",
"QUALITY_ENGINEER",
"AUDITOR",
"EMPLOYEE",
"VIEWER",
];

const MODULE_ORDER = [
"DASHBOARD",
"ORGANIZATION",
"USER",
"ROLE",
"PERMISSION",
"PAGEMETA",
"PAGE_METADATA",
"NCR",
"CAPA",
"AUDIT",
"DOCUMENT",
"TRAINING",
"SUPPLIER",
"REPORT",
];

const MODULE_LABELS = {
DASHBOARD: "Dashboard",
ORGANIZATION: "Organization",
USER: "Users",
ROLE: "Roles",
PERMISSION: "Permissions",
PAGEMETA: "Page Metadata",
PAGE_METADATA: "Page Metadata",
NCR: "Non-Conformance",
CAPA: "CAPA",
AUDIT: "Audits",
DOCUMENT: "Documents",
TRAINING: "Training",
SUPPLIER: "Suppliers",
REPORT: "Reports",
};

const formatPermissionName = (
permission
) => {
if (permission?.name) {
return permission.name;
}

return String(permission?.key || "")
.replace(/_/g, " ")
.replace(/\b\w/g, (char) =>
char.toUpperCase()
);
};

const formatRoleName = (role) => {
return String(role || "")
.replace(/_/g, " ")
.replace(/\b\w/g, (char) =>
char.toUpperCase()
);
};

export default function RoleFormModal({
open,
role,
loading,
canAssignPermissions = true,
onClose,
onSubmit,
}) {

const { user: currentUser } = useAuth();
const [form, setForm] =
useState(INITIAL_FORM);

const [permissions, setPermissions] =
useState([]);

const [permissionsLoading, setPermissionsLoading] =
useState(false);

const [permissionsError, setPermissionsError] =
useState("");

const [error, setError] =
useState("");

const [permissionSearch, setPermissionSearch] =
useState("");

const isEditing = Boolean(role);

const isSystemRole =
  role?.scope === "SYSTEM" ||
  SYSTEM_ROLE_NAMES.includes(role?.name);

const isSuperAdmin =
  currentUser?.role === "SUPER_ADMIN";

const canEditSystemRole =
  isSystemRole && isSuperAdmin;

const permissionAssignmentDisabled =
loading ||
permissionsLoading ||
!canAssignPermissions ||
(isSystemRole && !canEditSystemRole);

// ==========================================================
// INITIALIZE FORM
// ==========================================================

useEffect(() => {
if (!open) {
return;
}


if (role) {
  setForm({
    name: role.name || "",
    displayName:
      role.displayName || "",
    description:
      role.description || "",
    permissions:
      Array.isArray(role.permissions)
        ? role.permissions.map(
            (permission) =>
              typeof permission ===
              "string"
                ? permission
                : permission?._id
                ? String(
                    permission._id
                  )
                : ""
          ).filter(Boolean)
        : [],
    isActive:
      role.isActive !== false,
  });
} else {
  setForm({
    ...INITIAL_FORM,
  });
}

setError("");
setPermissionsError("");
setPermissionSearch("");


}, [open, role]);

// ==========================================================
// LOAD PERMISSIONS
// ==========================================================

useEffect(() => {
if (!open) {
return;
}


let cancelled = false;

const loadPermissions =
  async () => {
    try {
      setPermissionsLoading(true);
      setPermissionsError("");

      const response =
        await getPermissions();

      if (cancelled) {
        return;
      }

      const permissionData =
        response?.data?.permissions ||
        response?.data ||
        [];

      if (
        Array.isArray(
          permissionData
        )
      ) {
        setPermissions(
          permissionData
        );
      } else {
        setPermissions([]);
      }
    } catch (requestError) {
      if (cancelled) {
        return;
      }

      console.error(
        "Unable to load permissions:",
        requestError
      );

      setPermissionsError(
        requestError?.response
          ?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to load permissions."
      );

      setPermissions([]);
    } finally {
      if (!cancelled) {
        setPermissionsLoading(
          false
        );
      }
    }
  };

loadPermissions();

return () => {
  cancelled = true;
};


}, [open]);

// ==========================================================
// GROUP PERMISSIONS BY MODULE
// ==========================================================

const groupedPermissions =
useMemo(() => {
const search =
permissionSearch
.trim()
.toLowerCase();


  const groups = {};

  permissions.forEach(
    (permission) => {
      const module =
        permission?.module ||
        "OTHER";

      const key =
        String(
          permission?.key || ""
        ).toLowerCase();

      const name =
        String(
          permission?.name || ""
        ).toLowerCase();

      const description =
        String(
          permission?.description ||
            ""
        ).toLowerCase();

      if (
        search &&
        !key.includes(search) &&
        !name.includes(search) &&
        !description.includes(search)
      ) {
        return;
      }

      if (!groups[module]) {
        groups[module] = [];
      }

      groups[module].push(
        permission
      );
    }
  );

  return Object.entries(groups)
    .sort(
      ([moduleA], [moduleB]) => {
        const indexA =
          MODULE_ORDER.indexOf(
            moduleA
          );

        const indexB =
          MODULE_ORDER.indexOf(
            moduleB
          );

        if (
          indexA === -1 &&
          indexB === -1
        ) {
          return moduleA.localeCompare(
            moduleB
          );
        }

        if (indexA === -1) {
          return 1;
        }

        if (indexB === -1) {
          return -1;
        }

        return indexA - indexB;
      }
    )
    .map(
      ([
        module,
        modulePermissions,
      ]) => ({
        module,
        permissions:
          modulePermissions.sort(
            (a, b) =>
              String(
                a?.name || a?.key || ""
              ).localeCompare(
                String(
                  b?.name ||
                    b?.key ||
                    ""
                )
              )
          ),
      })
    );
}, [
  permissions,
  permissionSearch,
]);


// ==========================================================
// PERMISSION HELPERS
// ==========================================================

const getPermissionId = (
permission
) => {
return String(
permission?._id ||
permission?.id ||
permission?.key ||
""
);
};

const isPermissionSelected = (
permission
) => {
const id =
getPermissionId(permission);


return form.permissions.includes(
  id
);


};

const togglePermission = (
permission
) => {
if (
permissionAssignmentDisabled
) {
return;
}


const id =
  getPermissionId(permission);

if (!id) {
  return;
}

setForm((previous) => {
  const exists =
    previous.permissions.includes(
      id
    );

  return {
    ...previous,
    permissions: exists
      ? previous.permissions.filter(
          (item) =>
            item !== id
        )
      : [
          ...previous.permissions,
          id,
        ],
  };
});


};

const selectModulePermissions = (
modulePermissions
) => {
if (
permissionAssignmentDisabled
) {
return;
}


const ids =
  modulePermissions
    .map(
      (permission) =>
        getPermissionId(
          permission
        )
    )
    .filter(Boolean);

setForm((previous) => {
  const allSelected =
    ids.every((id) =>
      previous.permissions.includes(
        id
      )
    );

  if (allSelected) {
    return {
      ...previous,
      permissions:
        previous.permissions.filter(
          (id) =>
            !ids.includes(id)
        ),
    };
  }

  return {
    ...previous,
    permissions: Array.from(
      new Set([
        ...previous.permissions,
        ...ids,
      ])
    ),
  };
});


};

const selectAllPermissions = () => {
if (
permissionAssignmentDisabled
) {
return;
}


const ids = permissions
  .map(
    (permission) =>
      getPermissionId(permission)
  )
  .filter(Boolean);

setForm((previous) => ({
  ...previous,
  permissions: Array.from(
    new Set(ids)
  ),
}));


};

const clearAllPermissions = () => {
if (
permissionAssignmentDisabled
) {
return;
}


setForm((previous) => ({
  ...previous,
  permissions: [],
}));


};

// ==========================================================
// FORM CHANGE
// ==========================================================

const handleChange = (
event
) => {
const {
name,
value,
type,
checked,
} = event.target;


setForm((previous) => ({
  ...previous,
  [name]:
    type === "checkbox"
      ? checked
      : value,
}));


};

// ==========================================================
// SUBMIT
// ==========================================================

const handleSubmit =
async (event) => {
event.preventDefault();


  setError("");

  if (
    isSystemRole &&
    !canEditSystemRole
  ) {
    setError(
      "System roles can only be modified by SUPER_ADMIN."
    );
    return;
  }

  if (!form.name.trim()) {
    setError(
      "Role name is required."
    );
    return;
  }

  if (
    !/^[A-Za-z0-9_]+$/.test(
      form.name.trim()
    )
  ) {
    setError(
      "Role name may contain only letters, numbers, and underscores."
    );
    return;
  }

  if (
    !form.displayName.trim()
  ) {
    setError(
      "Display name is required."
    );
    return;
  }

  if (
    !isEditing &&
    !canAssignPermissions
  ) {
    setError(
      "You do not have permission to assign permissions."
    );
    return;
  }

  const payload = {
    name: form.name
      .trim()
      .toUpperCase(),

    displayName:
      form.displayName.trim(),

    description:
      form.description.trim(),
  };

  // System-role active status is protected. Do not send it when
  // SUPER_ADMIN is editing the global SUPER_ADMIN role.
  if (!isSystemRole) {
    payload.isActive = form.isActive;
  }

  /*
   * Only send permissions when the
   * authenticated user is allowed to
   * assign them.
   */
  if (
    canAssignPermissions
  ) {
    payload.permissions =
      form.permissions;
  }

  try {
    await onSubmit(payload);
  } catch (submitError) {
    console.error(
      "Unable to save role:",
      submitError
    );

    setError(
      submitError?.response
        ?.data?.message ||
        submitError?.apiMessage ||
        submitError?.message ||
        "Unable to save role."
    );
  }
};


// ==========================================================
// CLOSE
// ==========================================================

const handleClose = () => {
if (loading) {
return;
}


onClose();


};

// ==========================================================
// RENDER
// ==========================================================

if (!open) {
return null;
}

return ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">


  <div className="flex max-h-[calc(100vh-40px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

    {/* ==================================================
        HEADER
    ================================================== */}

    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing
            ? "Edit Role"
            : "Create Role"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? "Update role details and assigned permissions."
            : "Create an organization role and assign permissions."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleClose}
        disabled={loading}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Close"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 6l12 12M18 6L6 18"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>

    {/* ==================================================
        FORM
    ================================================== */}

    <form
      onSubmit={handleSubmit}
      className="min-h-0 flex-1 overflow-y-auto"
    >

      <div className="space-y-6 p-6">

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isSystemRole && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            canEditSystemRole
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            {canEditSystemRole
              ? "SUPER_ADMIN system role: you can update its permissions. The role name and system scope remain protected."
              : "This is a system role and cannot be modified."}
          </div>
        )}

        {/* ==================================================
            BASIC INFORMATION
        ================================================== */}

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role Name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={
                handleChange
              }
              disabled={
                loading ||
                isEditing ||
                isSystemRole
              }
              placeholder="QUALITY_MANAGER"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Use uppercase letters, numbers, and underscores.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>

            <input
              name="displayName"
              value={
                form.displayName
              }
              onChange={
                handleChange
              }
              disabled={
                loading ||
                (isSystemRole && !canEditSystemRole)
              }
              placeholder="Quality Manager"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              disabled={
                loading ||
                (isSystemRole && !canEditSystemRole)
              }
              rows={3}
              placeholder="Describe what this role is responsible for."
              className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={
                form.isActive
              }
              onChange={
                handleChange
              }
              disabled={
                loading ||
                isSystemRole
              }
              className="h-4 w-4 rounded border-gray-300"
            />

            <span className="text-sm font-medium text-gray-700">
              Active role
            </span>
          </label>
        </div>

        {/* ==================================================
            PERMISSION SECTION
        ================================================== */}

        <div className="rounded-xl border border-gray-200">

          <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Permissions
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Select the permissions available to this role.
                </p>
              </div>

              <div className="text-xs font-medium text-gray-600">
                {form.permissions.length} selected
                {" / "}
                {permissions.length}
              </div>

            </div>

            {!canAssignPermissions && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                You do not have permission to assign permissions.
              </div>
            )}

            {permissionsError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {permissionsError}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">

              <input
                type="search"
                value={
                  permissionSearch
                }
                onChange={(event) =>
                  setPermissionSearch(
                    event.target.value
                  )
                }
                placeholder="Search permissions..."
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              />

              {canAssignPermissions &&
                !isSystemRole && (
                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={
                        selectAllPermissions
                      }
                      disabled={
                        permissionAssignmentDisabled ||
                        permissions.length ===
                          0
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearAllPermissions
                      }
                      disabled={
                        permissionAssignmentDisabled ||
                        form.permissions
                          .length === 0
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>

                  </div>
                )}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">

            {permissionsLoading ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading permissions...
              </div>
            ) : groupedPermissions.length ===
              0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                {permissionSearch
                  ? "No permissions match your search."
                  : "No permissions available."}
              </div>
            ) : (
              <div className="space-y-5">

                {groupedPermissions.map(
                  ({
                    module,
                    permissions:
                      modulePermissions,
                  }) => {
                    const moduleIds =
                      modulePermissions
                        .map(
                          (
                            permission
                          ) =>
                            getPermissionId(
                              permission
                            )
                        )
                        .filter(
                          Boolean
                        );

                    const selectedCount =
                      moduleIds.filter(
                        (id) =>
                          form.permissions.includes(
                            id
                          )
                      ).length;

                    const allSelected =
                      moduleIds.length >
                        0 &&
                      selectedCount ===
                        moduleIds.length;

                    return (
                      <div
                        key={module}
                        className="rounded-lg border border-gray-200"
                      >

                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">

                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {MODULE_LABELS[
                                module
                              ] ||
                                formatRoleName(
                                  module
                                )}
                            </h4>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {selectedCount}
                              {" / "}
                              {
                                moduleIds.length
                              }{" "}
                              selected
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              selectModulePermissions(
                                modulePermissions
                              )
                            }
                            disabled={
                              permissionAssignmentDisabled
                            }
                            className="text-xs font-medium text-gray-700 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {allSelected
                              ? "Clear"
                              : "Select All"}
                          </button>

                        </div>

                        <div className="divide-y divide-gray-100">

                          {modulePermissions.map(
                            (
                              permission
                            ) => {
                              const permissionId =
                                getPermissionId(
                                  permission
                                );

                              const selected =
                                isPermissionSelected(
                                  permission
                                );

                              return (
                                <label
                                  key={
                                    permissionId
                                  }
                                  className={`flex cursor-pointer gap-3 px-4 py-3 transition ${
                                    permissionAssignmentDisabled
                                      ? "cursor-not-allowed opacity-60"
                                      : "hover:bg-gray-50"
                                  }`}
                                >

                                  <input
                                    type="checkbox"
                                    checked={
                                      selected
                                    }
                                    onChange={() =>
                                      togglePermission(
                                        permission
                                      )
                                    }
                                    disabled={
                                      permissionAssignmentDisabled
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                  />

                                  <span className="min-w-0 flex-1">

                                    <span className="block text-sm font-medium text-gray-800">
                                      {formatPermissionName(
                                        permission
                                      )}
                                    </span>

                                    {permission?.key && (
                                      <span className="mt-0.5 block text-xs text-gray-400">
                                        {
                                          permission.key
                                        }
                                      </span>
                                    )}

                                    {permission?.description && (
                                      <span className="mt-1 block text-xs text-gray-500">
                                        {
                                          permission.description
                                        }
                                      </span>
                                    )}

                                  </span>
                                </label>
                              );
                            }
                          )}

                        </div>
                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
        </div>

      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            loading ||
            (isSystemRole && !canEditSystemRole)
          }
          className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditing
            ? "Update Role"
            : "Create Role"}
        </button>

      </div>

    </form>
  </div>
</div>


);
}
