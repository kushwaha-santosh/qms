"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPermissions,
  createPermission,
  updatePermission,
  updatePermissionStatus,
  deletePermission,
} from "@/lib/api/permissions.api";

import PermissionTable from "@/components/permissions/PermissionTable";
import PermissionFormModal from "@/components/permissions/PermissionDetailsModal";
import PermissionConfirmModal from "@/components/permissions/PermissionConfirmModal";

import { useAuth } from "@/context/AuthProvider";

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.apiMessage ||
  error?.message ||
  fallback;

export default function PermissionsPage() {
  const {
    user,
    permissions = [],
    initialized,
    loading: authLoading,
  } = useAuth();

  // ========================================================
  // PERMISSION HELPER
  // ========================================================

  const hasPermission =
    useCallback(
      (permission) => {
        const required =
          String(
            permission || ""
          )
            .trim()
            .toUpperCase();

        if (!required) {
          return false;
        }

        if (
          user?.role ===
          "SUPER_ADMIN"
        ) {
          return true;
        }

        return permissions.some(
          (item) => {
            const key =
              String(
                item?.key ||
                  item?.code ||
                  item ||
                  ""
              )
                .trim()
                .toUpperCase();

            return (
              key === required
            );
          }
        );
      },
      [permissions, user]
    );

  // ========================================================
  // FLAGS
  // ========================================================

  const canView =
    hasPermission(
      "PERMISSION_VIEW"
    );

  const canCreate =
    hasPermission(
      "PERMISSION_CREATE"
    );

  const canUpdate =
    hasPermission(
      "PERMISSION_UPDATE"
    );

  const canDelete =
    hasPermission(
      "PERMISSION_DELETE"
    );

  // ========================================================
  // STATE
  // ========================================================

  const [
    permissionList,
    setPermissionList,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    confirmLoading,
    setConfirmLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  // ========================================================
  // FORM
  // ========================================================

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    selectedPermission,
    setSelectedPermission,
  ] = useState(null);

  // ========================================================
  // CONFIRMATION
  // ========================================================

  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);

  const [
    confirmPermission,
    setConfirmPermission,
  ] = useState(null);

  const [
    confirmAction,
    setConfirmAction,
  ] = useState("delete");

  // ========================================================
  // LOAD
  // ========================================================

  const loadPermissions =
    useCallback(
      async () => {
        if (!canView) {
          setPermissionList(
            []
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getPermissions({
              search,
              isActive:
                statusFilter,
            });

          setPermissionList(
            response?.data
              ?.permissions || []
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load permissions:",
            requestError
          );

          setPermissionList(
            []
          );

          setError(
            getErrorMessage(
              requestError,
              "Unable to load permissions."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        search,
        statusFilter,
      ]
    );

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    if (!initialized) {
      return;
    }

    loadPermissions();
  }, [
    initialized,
    loadPermissions,
  ]);

  // ========================================================
  // CREATE
  // ========================================================

  const handleCreate =
    () => {
      if (!canCreate) {
        return;
      }

      setSelectedPermission(
        null
      );

      setFormOpen(true);
      setError("");
    };

  // ========================================================
  // EDIT
  // ========================================================

  const handleEdit =
    (permission) => {
      if (!canUpdate) {
        return;
      }

      setSelectedPermission(
        permission
      );

      setFormOpen(true);
      setError("");
    };

  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit =
    async (data) => {
      try {
        setSaving(true);
        setError("");

        if (
          selectedPermission
        ) {
          await updatePermission(
            selectedPermission._id,
            data
          );
        } else {
          await createPermission(
            data
          );
        }

        setFormOpen(false);

        setSelectedPermission(
          null
        );

        await loadPermissions();
      } catch (
        requestError
      ) {
        console.error(
          "Unable to save permission:",
          requestError
        );

        setError(
          getErrorMessage(
            requestError,
            "Unable to save permission."
          )
        );

        throw requestError;
      } finally {
        setSaving(false);
      }
    };

  // ========================================================
  // STATUS
  // ========================================================

  const handleStatusChange =
    (
      permission,
      nextActive
    ) => {
      if (
        !canUpdate ||
        !permission
      ) {
        return;
      }

      setConfirmPermission(
        permission
      );

      setConfirmAction(
        nextActive
          ? "activate"
          : "deactivate"
      );

      setConfirmOpen(true);
      setError("");
    };

  // ========================================================
  // DELETE
  // ========================================================

  const handleDelete =
    (permission) => {
      if (
        !canDelete ||
        !permission
      ) {
        return;
      }

      setConfirmPermission(
        permission
      );

      setConfirmAction(
        "delete"
      );

      setConfirmOpen(true);
      setError("");
    };

  // ========================================================
  // CLOSE CONFIRM
  // ========================================================

  const closeConfirm =
    () => {
      if (confirmLoading) {
        return;
      }

      setConfirmOpen(false);

      setConfirmPermission(
        null
      );

      setConfirmAction(
        "delete"
      );
    };

  // ========================================================
  // CONFIRM
  // ========================================================

  const handleConfirm =
    async () => {
      if (
        !confirmPermission?._id ||
        confirmLoading
      ) {
        return;
      }

      try {
        setConfirmLoading(
          true
        );

        setError("");

        if (
          confirmAction ===
          "delete"
        ) {
          await deletePermission(
            confirmPermission._id
          );
        } else {
          await updatePermissionStatus(
            confirmPermission._id,
            confirmAction ===
              "activate"
          );
        }

        setConfirmOpen(
          false
        );

        setConfirmPermission(
          null
        );

        await loadPermissions();
      } catch (
        requestError
      ) {
        console.error(
          "Unable to process permission action:",
          requestError
        );

        setError(
          getErrorMessage(
            requestError,
            "Unable to update permission."
          )
        );
      } finally {
        setConfirmLoading(
          false
        );
      }
    };

  // ========================================================
  // AUTH LOADING
  // ========================================================

  if (
    authLoading ||
    !initialized
  ) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  // ========================================================
  // ACCESS DENIED
  // ========================================================

  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            You do not have permission to view the Permission Management page.
          </p>

          <p className="mt-4 text-xs text-gray-400">
            Required permission:
            PERMISSION_VIEW
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUMMARY
  // ========================================================

  const activeCount =
    permissionList.filter(
      (item) =>
        item?.isActive !==
        false
    ).length;

  const inactiveCount =
    permissionList.length -
    activeCount;

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <>
      <div>
        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Permissions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage the global permission catalog used by roles.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={
                handleCreate
              }
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Permission
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-4 font-medium text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* SUMMARY */}

        {!loading && (
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Permissions
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {
                  permissionList.length
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {activeCount}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Inactive
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-500">
                {inactiveCount}
              </p>
            </div>
          </div>
        )}

        {/* FILTERS */}

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search permissions..."
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            />

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="">
                All Status
              </option>

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>

            <button
              type="button"
              onClick={
                loadPermissions
              }
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Permission List
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Global permissions available for role assignment.
            </p>
          </div>

          <PermissionTable
            permissions={
              permissionList
            }
            loading={loading}
            canUpdate={
              canUpdate
            }
            canDelete={
              canDelete
            }
            onEdit={
              canUpdate
                ? handleEdit
                : undefined
            }
            onStatusChange={
              canUpdate
                ? handleStatusChange
                : undefined
            }
            onDelete={
              canDelete
                ? handleDelete
                : undefined
            }
          />
        </div>
      </div>

      {/* FORM */}

      <PermissionFormModal
        open={formOpen}
        permission={
          selectedPermission
        }
        loading={saving}
        onClose={() => {
          if (saving) {
            return;
          }

          setFormOpen(
            false
          );

          setSelectedPermission(
            null
          );
        }}
        onSubmit={
          handleSubmit
        }
      />

      {/* CONFIRM */}

      <PermissionConfirmModal
        open={
          confirmOpen
        }
        permission={
          confirmPermission
        }
        action={
          confirmAction
        }
        loading={
          confirmLoading
        }
        onClose={
          closeConfirm
        }
        onConfirm={
          handleConfirm
        }
      />
    </>
  );
}