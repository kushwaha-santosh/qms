"use client";

import React, { useState } from "react";

import { PERMISSIONS } from "@/lib/auth/permissions.js";
import UserStatusConfirmModal from "@/components/users/UserStatusConfirmModal";
// ==========================================================
// USER TABLE
// ==========================================================

export default function UserTable({
  users = [],
  loading = false,

  // ACTION HANDLERS
  onEdit,
  onDelete,
  onStatusChange,

  // PERMISSION HELPERS
  hasPermission,

  // CURRENT USER
  currentUser,
}) {
  // ========================================================
  // DELETE MODAL STATE
  // ========================================================

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusUser, setStatusUser] = useState(null);
  const [statusTarget, setStatusTarget] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  // ========================================================
  // PERMISSION CHECKS
  // ========================================================

  const canUpdateUser =
    typeof hasPermission === "function"
      ? hasPermission(PERMISSIONS.USER_UPDATE)
      : false;

  const canDeleteUser =
    typeof hasPermission === "function"
      ? hasPermission(PERMISSIONS.USER_DELETE)
      : false;

  const canUpdateStatus =
    typeof hasPermission === "function"
      ? hasPermission(PERMISSIONS.USER_STATUS_UPDATE)
      : false;

  // ========================================================
  // HELPERS
  // ========================================================

  const getUserName = (user) => {
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return name || "Unnamed User";
  };

  const getOrganizationName = (user) => {
    if (typeof user?.organizationId === "object") {
      return user.organizationId?.name || "—";
    }

    return "—";
  };

  const getCreatedByName = (user) => {
    const createdBy = user?.createdBy;

    if (!createdBy) {
      return "—";
    }

    if (typeof createdBy === "object") {
      const fullName =
        `${createdBy?.firstName || ""} ${createdBy?.lastName || ""}`.trim();

      return (
        fullName ||
        createdBy?.name ||
        createdBy?.fullName ||
        createdBy?.email ||
        "—"
      );
    }

    return "—";
  };

  const formatCreatedDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClasses = (status) => {
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
  // OPEN DELETE MODAL
  // ========================================================

  const handleDeleteClick = (user) => {
    if (!canDeleteUser || typeof onDelete !== "function") {
      return;
    }

    setDeleteUser(user);
  };

  // ========================================================
  // CLOSE DELETE MODAL
  // ========================================================

  const handleCloseDeleteModal = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteUser(null);
  };

  // ========================================================
  // CONFIRM DELETE
  // ========================================================

  const handleConfirmDelete = async () => {
    if (!deleteUser || !canDeleteUser || typeof onDelete !== "function") {
      return;
    }

    try {
      setDeleteLoading(true);

      await onDelete(deleteUser);

      setDeleteUser(null);
    } catch (error) {
      /*
       * UsersPage handles the actual API error and
       * displays it to the user.
       *
       * Keep the modal open if deletion fails so
       * the user can retry or cancel.
       */
      console.error("Unable to delete user:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
          Loading users...
        </div>
      </div>
    );
  }

  // ========================================================
  // EMPTY
  // ========================================================

  if (!users.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
          No users found.
        </div>
      </div>
    );
  }

  // ========================================================
  // TABLE
  // ========================================================

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                  Created By
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created Date
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                {(canUpdateUser || canDeleteUser || canUpdateStatus) && (
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
              {users.map((user) => {
                const isCurrentUser =
                  (currentUser?._id || currentUser?.id) &&
                  String(currentUser?._id || currentUser?.id) ===
                    String(user?._id || user?.id);

                return (
                  <tr key={user?._id || user?.id} className="hover:bg-gray-50">
                    {/* ========================================
                        USER
                    ======================================== */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                          {(user?.firstName || "U").charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(user)}

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
                      {getOrganizationName(user)}
                    </td>

                    {/* ========================================
                        ROLE
                    ======================================== */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {String(user?.role || "—").replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* ========================================
                        CREATED BY
                    ======================================== */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">
                        {getCreatedByName(user)}
                      </div>

                      {user?.createdBy &&
                        typeof user.createdBy === "object" &&
                        user.createdBy?.email && (
                          <div className="mt-0.5 text-xs text-gray-400">
                            {user.createdBy.email}
                          </div>
                        )}
                    </td>

                    {/* ========================================
                        CREATED DATE
                    ======================================== */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatCreatedDate(user?.createdAt)}
                    </td>

                    {/* ========================================
                        STATUS
                    ======================================== */}

                    <td className="whitespace-nowrap px-6 py-4">
                      {canUpdateStatus ? (
                        <select
                          value={user?.status || "ACTIVE"}
                          onChange={(event) =>
                            onStatusChange?.(user, event.target.value)
                          }
                          disabled={!onStatusChange}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${getStatusClasses(
                            user?.status,
                          )}`}
                        >
                          <option value="ACTIVE">ACTIVE</option>

                          <option value="INACTIVE">INACTIVE</option>

                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            user?.status,
                          )}`}
                        >
                          {user?.status || "—"}
                        </span>
                      )}
                    </td>

                    {/* ========================================
                        ACTIONS
                    ======================================== */}

                    {(canUpdateUser || canDeleteUser || canUpdateStatus) && (
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* ==================================
                              EDIT
                          ================================== */}

                          {canUpdateUser && (
                            <button
                              type="button"
                              onClick={() => onEdit?.(user)}
                              disabled={!onEdit}
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
                              onClick={() => handleDeleteClick(user)}
                              disabled={!onDelete}
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteUser && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-start gap-4 px-6 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v4m0 4h.01M10.29 3.86L2.82 17a2 2 0 001.74 3h14.88a2 2 0 001.74-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h2
                  id="delete-user-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Delete User
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Are you sure you want to delete this user?
                </p>
              </div>
            </div>

            {/* ==================================================
                USER DETAILS
            ================================================== */}

            <div className="mx-6 mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                {getUserName(deleteUser)}
              </p>

              {deleteUser.email && (
                <p className="mt-0.5 text-sm text-gray-600">
                  {deleteUser.email}
                </p>
              )}

              {deleteUser.role && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-red-700">
                  {String(deleteUser.role).replace(/_/g, " ")}
                </p>
              )}
            </div>

            {/* ==================================================
                WARNING
            ================================================== */}

            <p className="px-6 pt-4 text-sm leading-6 text-gray-600">
              This action cannot be undone. The user's account and associated
              access will be permanently removed.
            </p>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
