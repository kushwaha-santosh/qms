"use client";

import { DataTablePagination } from "@/components/common/data-table";
import AuditLogTable from "@/components/auditLogs/AuditLogTable";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAuditLogs,
} from "@/lib/api/auditLogs.api.js";

import {
  useAuth,
} from "@/context/AuthProvider.jsx";

import {
  PERMISSIONS,
} from "@/lib/auth/permissions.js";

import AuditLogDetailsModal from "@/components/auditLogs/AuditLogDetailsModal";

// ==========================================================
// CONSTANTS
// ==========================================================

const EMPTY_FILTERS = {
  search: "",
  module: "",
  action: "",
  startDate: "",
  endDate: "",
};

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "ACTIVATE",
  "DEACTIVATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_CHANGE",
  "ROLE_UPDATE",
  "PERMISSION_UPDATE",
  "APPROVE",
  "REJECT",
  "SUBMIT",
  "CLOSE",
  "REOPEN",
];

const MODULES = [
  "AUTH",
  "USER",
  "PROFILE",
  "ROLE",
  "PERMISSION",
  "ORGANIZATION",
  "NCR",
  "CAPA",
  "DOCUMENT",
  "AUDIT",
  "TRAINING",
  "SUPPLIER",
  "SETTINGS",
];

// ==========================================================
// PAGE
// ==========================================================

export default function AuditsPage() {
  const {
    hasPermission,
    loading: authLoading,
    initialized,
  } = useAuth();

  // ========================================================
  // PERMISSION
  // ========================================================

  const canViewAuditLogs =
    hasPermission(
      PERMISSIONS.AUDIT_VIEW
    );

  // ========================================================
  // FILTERS
  // ========================================================

  const [
    filters,
    setFilters,
  ] = useState(
    EMPTY_FILTERS
  );

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(
    EMPTY_FILTERS
  );

  // ========================================================
  // DATA
  // ========================================================

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // ========================================================
  // UI
  // ========================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedLog,
    setSelectedLog,
  ] = useState(null);

  // ========================================================
  // LOAD AUDIT LOGS
  // ========================================================

  const loadAuditLogs =
    useCallback(
      async (page = 1) => {
        /*
         * Never call the API if the authenticated
         * user doesn't have AUDIT_VIEW.
         */

        if (!canViewAuditLogs) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getAuditLogs({
              page,
              limit: 20,

              search:
                appliedFilters.search,

              module:
                appliedFilters.module,

              action:
                appliedFilters.action,

              startDate:
                appliedFilters.startDate,

              endDate:
                appliedFilters.endDate,
            });

          const result =
            response?.data;

          if (!result?.success) {
            throw new Error(
              result?.message ||
                "Unable to retrieve audit logs."
            );
          }

          setAuditLogs(
            result?.data?.auditLogs ||
              []
          );

          setPagination(
            result?.data?.pagination || {
              total: 0,
              page,
              limit: 20,
              totalPages: 1,
            }
          );
        } catch (requestError) {
          console.error(
            "Audit logs request error:",
            requestError
          );

          setAuditLogs([]);

          setPagination({
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
          });

          setError(
            requestError?.response?.data
              ?.message ||
              requestError?.apiMessage ||
              requestError?.message ||
              "Unable to retrieve audit logs."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        appliedFilters,
        canViewAuditLogs,
      ]
    );

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    /*
     * Wait until AuthProvider has finished loading
     * the authenticated user and permissions.
     */

    if (
      authLoading ||
      !initialized
    ) {
      return;
    }

    /*
     * User doesn't have permission.
     * Do not call the API.
     */

    if (!canViewAuditLogs) {
      return;
    }

    loadAuditLogs(1);
  }, [
    authLoading,
    initialized,
    canViewAuditLogs,
    loadAuditLogs,
  ]);

  // ========================================================
  // FILTER CHANGE
  // ========================================================

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFilters(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  // ========================================================
  // APPLY FILTERS
  // ========================================================

  const handleSubmit =
    (event) => {
      event.preventDefault();

      setAppliedFilters({
        ...filters,
      });
    };

  // ========================================================
  // RESET FILTERS
  // ========================================================

  const handleReset =
    () => {
      setFilters({
        ...EMPTY_FILTERS,
      });

      setAppliedFilters({
        ...EMPTY_FILTERS,
      });
    };

  // ========================================================
  // PAGE CHANGE
  // ========================================================

  const handlePageChange =
    (page) => {
      if (
        page < 1 ||
        page >
          pagination.totalPages
      ) {
        return;
      }

      loadAuditLogs(page);
    };

  // ========================================================
  // OPEN DETAILS
  // ========================================================

  const handleViewDetails =
    (log) => {
      setSelectedLog(log);
    };

  // ========================================================
  // CLOSE DETAILS
  // ========================================================

  const handleCloseDetails =
    () => {
      setSelectedLog(null);
    };

  // ========================================================
  // AUTH LOADING
  // ========================================================

  if (
    authLoading ||
    !initialized
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />

          <p className="text-sm text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // ACCESS DENIED
  // ========================================================

  if (!canViewAuditLogs) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          {/* ICON */}

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.3 3.5 2.9 19a1.5 1.5 0 0 0 1.3 2.2h15.6a1.5 1.5 0 0 0 1.3-2.2L13.7 3.5a1.9 1.9 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          {/* TITLE */}

          <h1 className="mt-5 text-xl font-semibold text-gray-900">
            Access Restricted
          </h1>

          {/* DESCRIPTION */}

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to view
            the audit logs.
          </p>

          {/* REQUIRED PERMISSION */}

          <div className="mt-5 inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
            Required permission:
            <span className="ml-1 font-semibold">
              AUDIT_VIEW
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-6 p-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Audit Logs
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Track user and system activity across the QMS.
        </p>
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {/* SEARCH */}

          <div className="xl:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Description, user, email..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* MODULE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Module
            </label>

            <select
              name="module"
              value={filters.module}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Modules
              </option>

              {MODULES.map(
                (module) => (
                  <option
                    key={module}
                    value={module}
                  >
                    {module}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ACTION */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Action
            </label>

            <select
              name="action"
              value={filters.action}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Actions
              </option>

              {ACTIONS.map(
                (action) => (
                  <option
                    key={action}
                    value={action}
                  >
                    {action}
                  </option>
                )
              )}
            </select>
          </div>

          {/* START DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From
            </label>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* END DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              To
            </label>

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* FILTER BUTTONS */}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ==================================================
          TABLE
      ================================================== */}

      <AuditLogTable
        auditLogs={auditLogs}
        loading={loading}
        onViewDetails={handleViewDetails}
      />

      <DataTablePagination
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        entityLabel="audit logs"
      />

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      <AuditLogDetailsModal
        open={Boolean(selectedLog)}
        auditLog={selectedLog}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

// ==========================================================
// DATE FORMATTER
// ==========================================================

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}