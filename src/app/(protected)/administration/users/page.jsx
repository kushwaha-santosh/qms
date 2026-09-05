"use client";

import { DataTablePagination } from "@/components/common/data-table";
import { useCallback, useEffect, useState } from "react";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/api/users.api";

import UserTable from "@/components/users/UserTable";
import UserFormModal from "@/components/users/UserFormModal";
import { useAuth } from "@/context/AuthProvider";

const ROLES = [
  "",
  "ORG_ADMIN",
  "QUALITY_MANAGER",
  "QUALITY_ENGINEER",
  "AUDITOR",
  "EMPLOYEE",
  "VIEWER",
];

const STATUSES = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canViewUsers = hasPermission("USER_VIEW");
  const canCreateUsers = hasPermission("USER_CREATE");
  const canUpdateUsers = hasPermission("USER_UPDATE");
  const canDeleteUsers = hasPermission("USER_DELETE");
  const canUpdateUserStatus = hasPermission("USER_STATUS_UPDATE");

  // ==========================================================
  // STATE
  // ==========================================================

  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // USER FORM MODAL
  // ==========================================================

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ==========================================================
  // STATUS CONFIRMATION MODAL
  // ==========================================================

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [nextUserStatus, setNextUserStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers = useCallback(
    async (page = 1) => {
      if (!canViewUsers) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getUsers({
          page,
          limit: 20,
          search,
          role,
          status,
        });

        setUsers(response?.data?.users || []);

        setPagination(
          response?.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (requestError) {
        console.error("Unable to load users:", requestError);

        setError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to load users.",
        );
      } finally {
        setLoading(false);
      }
    },
    [canViewUsers, search, role, status],
  );

  // ==========================================================
  // INITIAL / FILTER LOAD
  // ==========================================================

  useEffect(() => {
    if (!canViewUsers) {
      setLoading(false);
      return;
    }

    loadUsers(1);
  }, [canViewUsers, loadUsers]);

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const handleCreate = () => {
    if (!canCreateUsers) return;

    setSelectedUser(null);
    setModalOpen(true);
  };

  // ==========================================================
  // EDIT USER
  // ==========================================================

  const handleEdit = (user) => {
    if (!canUpdateUsers) return;

    setSelectedUser(user);
    setModalOpen(true);
  };

  // ==========================================================
  // CLOSE USER FORM MODAL
  // ==========================================================

  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);
    setSelectedUser(null);
  };

  // ==========================================================
  // CREATE / UPDATE USER
  // ==========================================================

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");

      if (selectedUser) {
        if (!canUpdateUsers) {
          throw new Error("You do not have permission to update users.");
        }

        await updateUser(selectedUser._id, data);
      } else {
        if (!canCreateUsers) {
          throw new Error("You do not have permission to create users.");
        }

        await createUser(data);
      }

      setModalOpen(false);
      setSelectedUser(null);

      await loadUsers(pagination.page);
    } catch (requestError) {
      console.error("Unable to save user:", requestError);
      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDelete = async (user) => {
    if (!canDeleteUsers) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.firstName} ${
        user.lastName || ""
      }?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteUser(user._id);

      const nextPage =
        users.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadUsers(nextPage);
    } catch (requestError) {
      console.error("Unable to delete user:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to delete user.",
      );
    }
  };

  // ==========================================================
  // OPEN STATUS CONFIRMATION
  // ==========================================================

  const handleStatusChange = (user, nextStatus) => {
    if (!canUpdateUserStatus || !user?._id || !nextStatus) {
      return;
    }

    if (user.status === nextStatus) {
      return;
    }

    // IMPORTANT:
    // Do NOT call the API here.
    // Only open the confirmation modal.

    setUserToUpdate(user);
    setNextUserStatus(nextStatus);
    setStatusModalOpen(true);
    setError("");
  };

  // ==========================================================
  // CLOSE STATUS CONFIRMATION
  // ==========================================================

  const handleCloseStatusModal = () => {
    if (updatingStatus) {
      return;
    }

    setStatusModalOpen(false);
    setUserToUpdate(null);
    setNextUserStatus("");
  };

  // ==========================================================
  // CONFIRM STATUS UPDATE
  // ==========================================================

  const handleConfirmStatusChange = async () => {
    if (
      !canUpdateUserStatus ||
      !userToUpdate?._id ||
      !nextUserStatus ||
      updatingStatus
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");

      await updateUser(userToUpdate._id, {
        status: nextUserStatus,
      });

      setStatusModalOpen(false);
      setUserToUpdate(null);
      setNextUserStatus("");

      await loadUsers(pagination.page);
    } catch (requestError) {
      console.error("Unable to update user status:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to update user status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const handlePrevious = () => {
    if (pagination.page <= 1) return;

    loadUsers(pagination.page - 1);
  };

  const handleNext = () => {
    if (pagination.page >= pagination.totalPages) return;

    loadUsers(pagination.page + 1);
  };

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  const getStatusLabel = (value) => {
    if (!value) return "";

    return value.charAt(0) + value.slice(1).toLowerCase();
  };

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!canViewUsers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {" "}
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {" "}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            {" "}
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />{" "}
            </svg>{" "}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to view the Users section.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      {" "}
      <div>
        {/* ==================================================
HEADER
================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage users and access within your organization.
            </p>
          </div>

          {canCreateUsers && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add User
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
          <div className="grid gap-3 md:grid-cols-[1fr_200px_180px_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email..."
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            />

            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item ? item.replace(/_/g, " ") : "All Roles"}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item || "All Statuses"}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadUsers(1)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ==================================================
        USER TABLE
    ================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <UserTable
            users={users}
            loading={loading}
            onEdit={canUpdateUsers ? handleEdit : undefined}
            onDelete={canDeleteUsers ? handleDelete : undefined}
            onStatusChange={
              canUpdateUserStatus ? handleStatusChange : undefined
            }
            hasPermission={hasPermission}
            currentUser={currentUser}
          />

          {/* ==================================================
          PAGINATION
      ================================================== */}

          <DataTablePagination
            pagination={pagination}
            loading={loading}
            onPageChange={(nextPage) => {
              if (nextPage < pagination.page) {
                handlePrevious();
              } else if (nextPage > pagination.page) {
                handleNext();
              }
            }}
            entityLabel="users"
            className="rounded-none border-0 shadow-none"
          />
        </div>
      </div>
      {/* ======================================================
      USER FORM MODAL
  ====================================================== */}
      {(canCreateUsers || canUpdateUsers) && (
        <UserFormModal
          open={modalOpen}
          user={selectedUser}
          loading={saving}
          currentUser={currentUser}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}
      {/* ======================================================
      STATUS CONFIRMATION MODAL
  ====================================================== */}
      {statusModalOpen && userToUpdate && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-status-title"
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
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2
                    id="user-status-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Change User Status
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
                  {userToUpdate.firstName} {userToUpdate.lastName || ""}
                </span>
                ?
              </p>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                  <div className="text-xs text-gray-400">Current Status</div>

                  <div className="mt-1 text-sm font-semibold text-gray-700">
                    {getStatusLabel(userToUpdate.status)}
                  </div>
                </div>

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

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                  <div className="text-xs text-gray-400">New Status</div>

                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {getStatusLabel(nextUserStatus)}
                  </div>
                </div>
              </div>

              {nextUserStatus === "INACTIVE" && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">
                  This user will no longer be able to use the application while
                  the account is inactive.
                </div>
              )}

              {nextUserStatus === "SUSPENDED" && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs leading-5 text-red-700">
                  This user will be prevented from accessing the application
                  while the account is suspended.
                </div>
              )}

              {nextUserStatus === "ACTIVE" && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-xs leading-5 text-green-700">
                  This user will be allowed to access the application again.
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
    </>
  );
}
