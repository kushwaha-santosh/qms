"use client";

import React from "react";

import { PERMISSIONS } from "@/lib/auth/permissions.js";

// ==========================================================
// USER TABLE
// ==========================================================

export default function UserTable({
users = [],
loading = false,

// --------------------------------------------------------
// ACTION HANDLERS
// --------------------------------------------------------

onEdit,
onDelete,
onStatusChange,

// --------------------------------------------------------
// PERMISSION HELPERS
// --------------------------------------------------------

hasPermission,

// --------------------------------------------------------
// CURRENT USER
// --------------------------------------------------------

currentUser,
}) {
// ========================================================
// PERMISSION CHECKS
// ========================================================

const canUpdateUser =
typeof hasPermission === "function"
? hasPermission(
PERMISSIONS.USER_UPDATE
)
: false;

const canDeleteUser =
typeof hasPermission === "function"
? hasPermission(
PERMISSIONS.USER_DELETE
)
: false;

const canUpdateStatus =
typeof hasPermission === "function"
? hasPermission(
PERMISSIONS.USER_STATUS_UPDATE
)
: false;

// ========================================================
// HELPERS
// ========================================================

const getUserName = (user) => {
const name =
`${user?.firstName || ""} ${
        user?.lastName || ""
      }`.trim();


return name || "Unnamed User";


};

const getOrganizationName = (
user
) => {
if (
typeof user?.organizationId ===
"object"
) {
return (
user.organizationId?.name ||
"—"
);
}


return "—";


};

const getStatusClasses = (
status
) => {
switch (status) {
case "ACTIVE":
return "bg-green-100 text-green-700";


  case "INACTIVE":
    return "bg-gray-100 text-gray-700";

  case "SUSPENDED":
    return "bg-red-100 text-red-700";

  default:
    return "bg-gray-100 text-gray-700";
}


};

// ========================================================
// LOADING
// ========================================================

if (loading) {
return ( <div className="rounded-xl border border-gray-200 bg-white"> <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
Loading users... </div> </div>
);
}

// ========================================================
// EMPTY
// ========================================================

if (!users.length) {
return ( <div className="rounded-xl border border-gray-200 bg-white"> <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
No users found. </div> </div>
);
}

// ========================================================
// TABLE
// ========================================================

return ( <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">


  <div className="overflow-x-auto">

    <table className="min-w-full divide-y divide-gray-200">

      {/* ==================================================
          HEADER
      ================================================== */}

      <thead className="bg-gray-50">

        <tr>

          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            User
          </th>

          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Email
          </th>

          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Organization
          </th>

          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Role
          </th>

          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Status
          </th>

          {(canUpdateUser ||
            canDeleteUser ||
            canUpdateStatus) && (
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Actions
            </th>
          )}

        </tr>

      </thead>


      {/* ==================================================
          BODY
      ================================================== */}

      <tbody className="divide-y divide-gray-200 bg-white">

        {users.map(
          (user) => {

            const isCurrentUser =
              currentUser?.id &&
              String(
                currentUser.id
              ) ===
                String(
                  user?._id ||
                    user?.id
                );

            return (
              <tr
                key={
                  user?._id ||
                  user?.id
                }
                className="hover:bg-gray-50"
              >

                {/* ========================================
                    USER
                ======================================== */}

                <td className="whitespace-nowrap px-6 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {(
                        user?.firstName ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <div className="text-sm font-medium text-gray-900">
                        {getUserName(
                          user
                        )}

                        {isCurrentUser && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            You
                          </span>
                        )}
                      </div>

                    </div>

                  </div>

                </td>


                {/* ========================================
                    EMAIL
                ======================================== */}

                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {user?.email || "—"}
                </td>


                {/* ========================================
                    ORGANIZATION
                ======================================== */}

                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {getOrganizationName(
                    user
                  )}
                </td>


                {/* ========================================
                    ROLE
                ======================================== */}

                <td className="whitespace-nowrap px-6 py-4">

                  <span className="text-sm font-medium text-gray-700">
                    {String(
                      user?.role ||
                        "—"
                    ).replace(
                      /_/g,
                      " "
                    )}
                  </span>

                </td>


                {/* ========================================
                    STATUS
                ======================================== */}

                <td className="whitespace-nowrap px-6 py-4">

                  {canUpdateStatus ? (
                    <select
                      value={
                        user?.status ||
                        "ACTIVE"
                      }
                      onChange={(event) =>
                        onStatusChange?.(
                          user,
                          event.target.value
                        )
                      }
                      disabled={
                        !onStatusChange
                      }
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${getStatusClasses(
                        user?.status
                      )}`}
                    >
                      <option value="ACTIVE">
                        ACTIVE
                      </option>

                      <option value="INACTIVE">
                        INACTIVE
                      </option>

                      <option value="SUSPENDED">
                        SUSPENDED
                      </option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        user?.status
                      )}`}
                    >
                      {user?.status ||
                        "—"}
                    </span>
                  )}

                </td>


                {/* ========================================
                    ACTIONS
                ======================================== */}

                {(canUpdateUser ||
                  canDeleteUser ||
                  canUpdateStatus) && (

                  <td className="whitespace-nowrap px-6 py-4 text-right">

                    <div className="flex justify-end gap-2">

                      {/* ==================================
                          EDIT
                      ================================== */}

                      {canUpdateUser && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              typeof onEdit ===
                              "function"
                            ) {
                              onEdit(
                                user
                              );
                            }
                          }}
                          disabled={
                            !onEdit
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}


                      {/* ==================================
                          DELETE
                      ================================== */}

                      {canDeleteUser && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              typeof onDelete ===
                              "function"
                            ) {
                              onDelete(
                                user
                              );
                            }
                          }}
                          disabled={
                            !onDelete
                          }
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}

                    </div>

                  </td>

                )}

              </tr>
            );
          }
        )}

      </tbody>

    </table>

  </div>

</div>


);
}
