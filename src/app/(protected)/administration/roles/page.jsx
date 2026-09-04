"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getRoles,
  createRole,
  updateRole,
  updateRoleStatus,
  deleteRole,
} from "@/lib/api/roles.api";

import RoleTable from "@/components/roles/RoleTable";
import RoleFormModal from "@/components/roles/RoleFormModal";

import { useAuth } from "@/context/AuthProvider";

// ==========================================================
// DEFAULT PAGINATION
// ==========================================================

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

// ==========================================================
// ROLES PAGE
// ==========================================================

export default function RolesPage() {
  const {
    user,
    permissions = [],
    initialized,
    loading: authLoading,
  } = useAuth();

  // ========================================================
  // PERMISSION HELPER
  // ========================================================

  const hasPermission = useCallback(
    (permission) => {
      const required = String(permission || "")
        .trim()
        .toUpperCase();

      if (!required) {
        return false;
      }

      return permissions.some((item) => {
        const key = String(item?.key || item?.code || item || "")
          .trim()
          .toUpperCase();

        return key === required;
      });
    },
    [permissions],
  );

  // ========================================================
  // PERMISSION FLAGS
  // ========================================================

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const canViewRoles = isSuperAdmin || hasPermission("ROLE_VIEW");

  const canCreateRoles = isSuperAdmin || hasPermission("ROLE_CREATE");

  const canUpdateRoles = isSuperAdmin || hasPermission("ROLE_UPDATE");

  const canDeleteRoles = !isSuperAdmin && hasPermission("ROLE_DELETE");

  // ========================================================
  // STATE
  // ========================================================

  const [roles, setRoles] = useState([]);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ========================================================
  // ROLE FORM MODAL
  // ========================================================

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState(null);

  // ========================================================
  // STATUS CONFIRMATION MODAL
  // ========================================================

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const [roleToUpdate, setRoleToUpdate] = useState(null);

  const [nextRoleStatus, setNextRoleStatus] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ========================================================
  // DELETE CONFIRMATION MODAL
  // ========================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [roleToDelete, setRoleToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  // ========================================================
  // LOAD ROLES
  // ========================================================

  const loadRoles = useCallback(
    async (page = 1) => {
      if (!canViewRoles) {
        setRoles([]);
        setPagination(DEFAULT_PAGINATION);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getRoles({
          page,
          limit: 20,
          search,
        });

        setRoles(
          Array.isArray(response?.data?.roles) ? response.data.roles : [],
        );

        setPagination(response?.data?.pagination || DEFAULT_PAGINATION);
      } catch (requestError) {
        console.error("Unable to load roles:", requestError);

        setRoles([]);

        setError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to load roles.",
        );
      } finally {
        setLoading(false);
      }
    },
    [canViewRoles, search],
  );

  // ========================================================
  // INITIAL / FILTER LOAD
  // ========================================================

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!canViewRoles) {
      setLoading(false);
      setRoles([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    loadRoles(1);
  }, [initialized, canViewRoles, loadRoles]);

  // ========================================================
  // CREATE ROLE
  // ========================================================

  const handleCreate = () => {
    if (!canCreateRoles) {
      return;
    }

    setError("");
    setSelectedRole(null);
    setModalOpen(true);
  };

  // ========================================================
  // EDIT ROLE
  // ========================================================

  const handleEdit = (role) => {
    if (!canUpdateRoles || !role) {
      return;
    }

    setError("");
    setSelectedRole(role);
    setModalOpen(true);
  };

  // ========================================================
  // CLOSE ROLE FORM MODAL
  // ========================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setSelectedRole(null);
  };

  // ========================================================
  // CREATE / UPDATE ROLE
  // ========================================================

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");

      if (selectedRole) {
        if (!canUpdateRoles) {
          throw new Error("You do not have permission to update roles.");
        }

        await updateRole(selectedRole._id, data);
      } else {
        if (!canCreateRoles) {
          throw new Error("You do not have permission to create roles.");
        }

        await createRole(data);
      }

      setModalOpen(false);
      setSelectedRole(null);

      await loadRoles(pagination.page);
    } catch (requestError) {
      console.error("Unable to save role:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to save role.",
      );

      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // OPEN STATUS CONFIRMATION
  // ========================================================

  const handleStatusChange = (role, isActive) => {
    if (!canUpdateRoles || !role?._id || typeof isActive !== "boolean") {
      return;
    }

    // IMPORTANT:
    // Missing / undefined isActive is treated as ACTIVE.
    const currentIsActive = role?.isActive !== false;

    if (currentIsActive === isActive) {
      return;
    }

    // Do not call API here.
    // Only open confirmation modal.

    setError("");

    setRoleToUpdate(role);

    setNextRoleStatus(isActive);

    setStatusModalOpen(true);
  };

  // ========================================================
  // CLOSE STATUS MODAL
  // ========================================================

  const handleCloseStatusModal = () => {
    if (updatingStatus) {
      return;
    }

    setStatusModalOpen(false);
    setRoleToUpdate(null);
    setNextRoleStatus(null);
  };

  // ========================================================
  // CONFIRM STATUS UPDATE
  // ========================================================

  const handleConfirmStatusChange = async () => {
    if (
      !canUpdateRoles ||
      !roleToUpdate?._id ||
      typeof nextRoleStatus !== "boolean" ||
      updatingStatus
    ) {
      return;
    }

    const previousRoles = roles;

    try {
      setUpdatingStatus(true);
      setError("");

      // Optimistic update.
      setRoles((currentRoles) =>
        currentRoles.map((item) =>
          String(item?._id) === String(roleToUpdate._id)
            ? {
                ...item,
                isActive: nextRoleStatus,
              }
            : item,
        ),
      );

      await updateRoleStatus(roleToUpdate._id, nextRoleStatus);

      setStatusModalOpen(false);
      setRoleToUpdate(null);
      setNextRoleStatus(null);

      await loadRoles(pagination.page);
    } catch (requestError) {
      console.error("Unable to update role status:", requestError);

      setRoles(previousRoles);

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to update role status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ========================================================
  // OPEN DELETE CONFIRMATION
  // ========================================================

  const handleDelete = (role) => {
    if (!canDeleteRoles || !role) {
      return;
    }

    // System roles cannot be deleted.
    if (role?.scope === "SYSTEM") {
      setError("System roles cannot be deleted.");
      return;
    }

    setError("");
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  // ========================================================
  // CLOSE DELETE MODAL
  // ========================================================

  const handleCloseDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  // ========================================================
  // CONFIRM DELETE
  // ========================================================

  const handleConfirmDelete = async () => {
    if (!canDeleteRoles || !roleToDelete?._id || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteRole(roleToDelete._id);

      const nextPage =
        roles.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      setDeleteModalOpen(false);
      setRoleToDelete(null);

      await loadRoles(nextPage);
    } catch (requestError) {
      console.error("Unable to delete role:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to delete role.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ========================================================
  // PAGINATION
  // ========================================================

  const handlePrevious = () => {
    if (pagination.page <= 1) {
      return;
    }

    loadRoles(pagination.page - 1);
  };

  const handleNext = () => {
    if (pagination.page >= pagination.totalPages) {
      return;
    }

    loadRoles(pagination.page + 1);
  };

  // ========================================================
  // STATUS LABEL
  // ========================================================

  const getStatusLabel = (value) => {
    return value ? "Active" : "Inactive";
  };

  // ========================================================
  // AUTH LOADING
  // ========================================================

  if (authLoading || !initialized) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  // ========================================================
  // ACCESS DENIED
  // ========================================================

  if (!canViewRoles) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>

          <p className="mt-2 text-sm text-gray-500">
            You do not have permission to view the Role Management page.
          </p>

          <p className="mt-4 text-xs text-gray-400">
            Required permission: ROLE_VIEW
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <>
      <div>
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage organization roles and their access configuration.
            </p>
          </div>

          {canCreateRoles && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Role
            </button>
          )}
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roles..."
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            />

            <button
              type="button"
              onClick={() => loadRoles(1)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ==================================================
            ROLE TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <RoleTable
            roles={roles}
            loading={loading}
            onEdit={canUpdateRoles ? handleEdit : undefined}
            onDelete={canDeleteRoles ? handleDelete : undefined}
            canUpdate={canUpdateRoles}
            canDelete={canDeleteRoles}
            onStatusChange={canUpdateRoles ? handleStatusChange : undefined}
          />

          {/* ==================================================
              PAGINATION
          ================================================== */}

          {!loading && pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Showing page{" "}
                <span className="font-medium text-gray-900">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {pagination.totalPages}
                </span>{" "}
                ·{" "}
                <span className="font-medium text-gray-900">
                  {pagination.total}
                </span>{" "}
                roles
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          ROLE FORM MODAL
      ====================================================== */}

      <RoleFormModal
        open={modalOpen}
        role={selectedRole}
        loading={saving}
        currentUser={user}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* ======================================================
          STATUS CONFIRMATION MODAL
      ====================================================== */}

      {statusModalOpen && roleToUpdate && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-status-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* ==================================================
                  HEADER
              ================================================== */}

            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 003.42 0z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2
                    id="role-status-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Change Role Status
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Please confirm this status change.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                  BODY
              ================================================== */}

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold text-gray-900">
                  {roleToUpdate?.displayName ||
                    roleToUpdate?.name ||
                    "this role"}
                </span>
                ?
              </p>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* CURRENT STATUS */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                  <div className="text-xs text-gray-400">Current Status</div>

                  <div className="mt-1 text-sm font-semibold text-gray-700">
                    {getStatusLabel(
                      // IMPORTANT:
                      // undefined is treated as Active.
                      roleToUpdate?.isActive !== false,
                    )}
                  </div>
                </div>

                {/* ARROW */}

                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* NEW STATUS */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                  <div className="text-xs text-gray-400">New Status</div>

                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {getStatusLabel(nextRoleStatus)}
                  </div>
                </div>
              </div>

              {nextRoleStatus === false && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">
                  This role will be inactive and users assigned to this role may
                  no longer be able to use its permissions.
                </div>
              )}

              {nextRoleStatus === true && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-xs leading-5 text-green-700">
                  This role will be active and its configured permissions will
                  be available again.
                </div>
              )}
            </div>

            {/* ==================================================
                  FOOTER
              ================================================== */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseStatusModal}
                disabled={updatingStatus}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={updatingStatus}
                className="inline-flex min-w-[150px] items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Confirm Status Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteModalOpen && roleToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-role-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* ==================================================
                  MODAL HEADER
              ================================================== */}

            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 003.42 0z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h2
                    id="delete-role-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Delete Role
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                  MODAL BODY
              ================================================== */}

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {roleToDelete?.displayName ||
                    roleToDelete?.name ||
                    "this role"}
                </span>
                ?
              </p>

              {roleToDelete?.name && (
                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-400">Role key</span>

                  <div className="mt-0.5 text-sm font-medium text-gray-700">
                    {roleToDelete.name}
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================
                  MODAL FOOTER
              ================================================== */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex min-w-[100px] items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Role"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
