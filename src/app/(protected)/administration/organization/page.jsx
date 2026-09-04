"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
} from "@/lib/api/organization.api";

import OrganizationTable from "@/components/organizations/OrganizationTable";
import OrganizationFormModal from "@/components/organizations/OrganizationFormModal";

import { useAuth } from "@/context/AuthProvider";

/* ==========================================================
 * ORGANIZATIONS PAGE
 * ========================================================== */

export default function OrganizationsPage() {
  const {
    user,
    permissions = [],
    initialized,
    loading: authLoading,
  } = useAuth();

  /* ========================================================
   * PERMISSION HELPER
   * ======================================================== */

  const hasPermission = useCallback(
    (permission) => {
      const required = String(permission || "")
        .trim()
        .toUpperCase();

      if (!required) {
        return false;
      }

      /*
       * SUPER_ADMIN is globally authorized.
       */
      if (user?.role === "SUPER_ADMIN") {
        return true;
      }

      return permissions.some((item) => {
        const key = String(
          item?.key ||
            item?.code ||
            item ||
            ""
        )
          .trim()
          .toUpperCase();

        return key === required;
      });
    },
    [permissions, user]
  );

  /* ========================================================
   * PERMISSION FLAGS
   * ======================================================== */

  const canViewOrganizations = hasPermission(
    "ORGANIZATION_VIEW"
  );

  const canUpdateOrganizations = hasPermission(
    "ORGANIZATION_UPDATE"
  );

  /*
   * Organization creation is currently a
   * SUPER_ADMIN management operation.
   */
  const canCreateOrganizations =
    user?.role === "SUPER_ADMIN" &&
    canUpdateOrganizations;

  /* ========================================================
   * STATE
   * ======================================================== */

  const [organizations, setOrganizations] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [
    selectedOrganization,
    setSelectedOrganization,
  ] = useState(null);

  /* ========================================================
   * STATUS CONFIRMATION MODAL
   * ======================================================== */

  const [
    statusConfirmOpen,
    setStatusConfirmOpen,
  ] = useState(false);

  const [
    statusOrganization,
    setStatusOrganization,
  ] = useState(null);

  const [
    pendingStatus,
    setPendingStatus,
  ] = useState("");

  const [
    statusUpdating,
    setStatusUpdating,
  ] = useState(false);

  /* ========================================================
   * LOAD ORGANIZATIONS
   * ======================================================== */

  const loadOrganizations = useCallback(
    async () => {
      if (!canViewOrganizations) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getOrganizations();

        setOrganizations(
          Array.isArray(data) ? data : []
        );
      } catch (requestError) {
        console.error(
          "Unable to load organizations:",
          requestError
        );

        setOrganizations([]);

        setError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to load organizations."
        );
      } finally {
        setLoading(false);
      }
    },
    [canViewOrganizations]
  );

  /* ========================================================
   * INITIAL LOAD
   * ======================================================== */

  useEffect(() => {
    if (!initialized) {
      return;
    }

    loadOrganizations();
  }, [
    initialized,
    loadOrganizations,
  ]);

  /* ========================================================
   * CREATE
   * ======================================================== */

  const handleCreate = () => {
    if (!canCreateOrganizations) {
      return;
    }

    setSelectedOrganization(null);
    setModalOpen(true);
  };

  /* ========================================================
   * EDIT
   * ======================================================== */

  const handleEdit = (organization) => {
    if (!canUpdateOrganizations) {
      return;
    }

    setSelectedOrganization(organization);
    setModalOpen(true);
  };

  /* ========================================================
   * CLOSE FORM MODAL
   * ======================================================== */

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setSelectedOrganization(null);
  };

  /* ========================================================
   * CREATE / UPDATE
   * ======================================================== */

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");

      if (selectedOrganization) {
        await updateOrganization(
          selectedOrganization._id,
          data
        );
      } else {
        await createOrganization(data);
      }

      setModalOpen(false);
      setSelectedOrganization(null);

      await loadOrganizations();
    } catch (requestError) {
      console.error(
        "Unable to save organization:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to save organization."
      );

      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
   * OPEN STATUS CONFIRMATION
   * ======================================================== */

  const handleStatusChange = (
    organization,
    status
  ) => {
    if (!canUpdateOrganizations) {
      return;
    }

    if (!organization?._id) {
      return;
    }

    const currentStatus =
      organization?.status || "ACTIVE";

    /*
     * Do nothing if the selected status
     * is already the current status.
     */
    if (currentStatus === status) {
      return;
    }

    setStatusOrganization(organization);
    setPendingStatus(status);
    setStatusConfirmOpen(true);
  };

  /* ========================================================
   * CLOSE STATUS CONFIRMATION
   * ======================================================== */

  const handleCloseStatusConfirm = () => {
    if (statusUpdating) {
      return;
    }

    setStatusConfirmOpen(false);
    setStatusOrganization(null);
    setPendingStatus("");
  };

  /* ========================================================
   * CONFIRM STATUS CHANGE
   * ======================================================== */

  const handleConfirmStatusChange =
    async () => {
      if (
        !statusOrganization?._id ||
        !pendingStatus
      ) {
        return;
      }

      try {
        setStatusUpdating(true);
        setError("");

        await updateOrganizationStatus(
          statusOrganization._id,
          pendingStatus
        );

        /*
         * Close modal after successful update.
         */
        setStatusConfirmOpen(false);
        setStatusOrganization(null);
        setPendingStatus("");

        /*
         * Reload latest organization data.
         */
        await loadOrganizations();
      } catch (requestError) {
        console.error(
          "Unable to update organization status:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to update organization status."
        );
      } finally {
        setStatusUpdating(false);
      }
    };

  /* ========================================================
   * STATUS HELPERS
   * ======================================================== */

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Active";

      case "INACTIVE":
        return "Inactive";

      case "SUSPENDED":
        return "Suspended";

      default:
        return status || "Unknown";
    }
  };

  /* ========================================================
   * AUTH LOADING
   * ======================================================== */

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

  /* ========================================================
   * ACCESS DENIED
   * ======================================================== */

  if (!canViewOrganizations) {
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
            You do not have permission
            to view the Organization
            Management page.
          </p>

          <p className="mt-4 text-xs text-gray-400">
            Required permission:
            ORGANIZATION_VIEW
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================
   * PAGE
   * ======================================================== */

  return (
    <>
      <div>
        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Organizations
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage organizations,
              subscription plans and
              organization status.
            </p>
          </div>

          {canCreateOrganizations && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Organization
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
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
                Total Organizations
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {organizations.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {
                  organizations.filter(
                    (item) =>
                      item?.status ===
                      "ACTIVE"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Suspended
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {
                  organizations.filter(
                    (item) =>
                      item?.status ===
                      "SUSPENDED"
                  ).length
                }
              </p>
            </div>
          </div>
        )}

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Organization List
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Organization management
                based on your permissions.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrganizations}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <OrganizationTable
            organizations={organizations}
            loading={loading}
            canUpdate={canUpdateOrganizations}
            onEdit={
              canUpdateOrganizations
                ? handleEdit
                : undefined
            }
            onStatusChange={
              canUpdateOrganizations
                ? handleStatusChange
                : undefined
            }
          />
        </div>
      </div>

      {/* ======================================================
       * ORGANIZATION FORM MODAL
       * ====================================================== */}

      <OrganizationFormModal
        open={modalOpen}
        organization={
          selectedOrganization
        }
        loading={saving}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* ======================================================
       * STATUS CONFIRMATION MODAL
       * ====================================================== */}

      {statusConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseStatusConfirm();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                  <svg
                    className="h-5 w-5 text-amber-600"
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

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Change Organization Status
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Please confirm this action.
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL BODY */}

            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to change
                the status of{" "}
                <span className="font-semibold text-gray-900">
                  {statusOrganization?.name ||
                    "this organization"}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {getStatusLabel(
                    pendingStatus
                  )}
                </span>
                ?
              </p>

              {pendingStatus ===
                "SUSPENDED" && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  Suspended organizations may
                  be prevented from normal
                  organization operations.
                </div>
              )}

              {pendingStatus ===
                "INACTIVE" && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-600">
                  Inactive organizations will
                  not be considered active in
                  the system.
                </div>
              )}

              {pendingStatus ===
                "ACTIVE" && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
                  This will activate the
                  organization again.
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={
                  handleCloseStatusConfirm
                }
                disabled={statusUpdating}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmStatusChange
                }
                disabled={statusUpdating}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  pendingStatus ===
                  "SUSPENDED"
                    ? "bg-red-600 hover:bg-red-700"
                    : pendingStatus ===
                      "INACTIVE"
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {statusUpdating
                  ? "Updating..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}