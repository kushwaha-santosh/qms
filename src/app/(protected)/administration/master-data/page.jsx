"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthProvider";

import {
  getMasterDataTypes,
  getMasterData,
  createMasterData,
  updateMasterData,
  updateMasterDataStatus,
  deleteMasterData,
} from "@/lib/api/masterData.api";

import { getOrganizations } from "@/lib/api/organization.api";

import MasterDataTable from "@/components/masterData/MasterDataTable";
import MasterDataFormModal from "@/components/masterData/MasterDataFormModal";

const LABELS = {
  QMS_SOURCE: "Source",
  QMS_SEVERITY: "Severity",
  QMS_CATEGORY: "Category",
  QMS_STATUS: "Status",
  ROOT_CAUSE_CATEGORY: "Root Cause Category",
  AUDIT_TYPE: "Audit Type",
  SUPPLIER_TYPE: "Supplier Type",
  SUPPLIER: "Supplier",
  DOCUMENT_TYPE: "Document Type",
  TRAINING_TYPE: "Training Type",
  DEPARTMENT: "Department",
  PROCESS: "Process",
  UOM: "Unit of Measure",
  PRODUCT_CATEGORY: "Product Category",
  PRODUCT_TYPE: "Product Type",
  BRAND: "Brand",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function MasterDataPage() {
  const {
    user,
    permissions = [],
    initialized,
    loading: authLoading,
  } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  /* ========================================================
   * PERMISSIONS
   * ======================================================== */

  const hasPermission = (key) => {
    if (isSuperAdmin) return true;

    const required = String(key || "")
      .trim()
      .toUpperCase();

    return permissions.some(
      (item) =>
        String(item?.key || item?.code || item || "")
          .trim()
          .toUpperCase() === required,
    );
  };

  const canView = hasPermission("MASTER_DATA_VIEW");

  const canCreate = hasPermission("MASTER_DATA_CREATE");

  const canUpdate = hasPermission("MASTER_DATA_UPDATE");

  const canDelete = hasPermission("MASTER_DATA_DELETE");

  const canStatusUpdate = hasPermission("MASTER_DATA_STATUS_UPDATE");

  /* ========================================================
   * STATE
   * ======================================================== */

  const [types, setTypes] = useState([]);

  const [type, setType] = useState("QMS_CATEGORY");

  const [data, setData] = useState([]);

  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [scopeFilter, setScopeFilter] = useState("ALL");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [confirmation, setConfirmation] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  /* ========================================================
   * SELECTED TYPE LABEL
   * ======================================================== */

  const selectedLabel = useMemo(() => LABELS[type] || type, [type]);

  /* ========================================================
   * TYPE OPTIONS
   * ======================================================== */

  const typeOptions = useMemo(() => {
    return types.map((item) => ({
      value: item,
      label: LABELS[item] || item,
    }));
  }, [types]);

  /* ========================================================
   * LOAD MASTER DATA
   * ======================================================== */

  const loadData = useCallback(
    async ({
      requestedPage = page,
      requestedLimit = limit,
      requestedSearch = search,
      requestedType = type,
    } = {}) => {
      if (!canView || !requestedType) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getMasterData(requestedType, {
          includeInactive: true,
          search: requestedSearch,
          page: requestedPage,
          limit: requestedLimit,
        });

        setData(Array.isArray(response?.data) ? response.data : []);

        setPagination(
          response?.pagination || {
            page: requestedPage,
            limit: requestedLimit,
            total: 0,
            totalPages: 0,
            hasPreviousPage: requestedPage > 1,
            hasNextPage: false,
          },
        );
      } catch (loadError) {
        console.error("Unable to load master data:", loadError);

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Unable to load master data.",
        );

        setData([]);

        setPagination({
          page: 1,
          limit: requestedLimit,
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [canView, page, limit, search, type],
  );

  /* ========================================================
   * INITIAL LOAD
   * ======================================================== */

  useEffect(() => {
    if (!initialized || authLoading || !canView) {
      return;
    }

    const loadInitialData = async () => {
      try {
        setError("");

        const typeResponse = await getMasterDataTypes();

        const availableTypes = Array.isArray(typeResponse?.data)
          ? typeResponse.data
          : [];

        const filteredTypes = availableTypes.filter(
          (item) => item !== "ORG_LOCATION",
        );

        const finalTypes = filteredTypes.length
          ? filteredTypes
          : Object.keys(LABELS);

        setTypes(finalTypes);

        /*
         * If the current selected type does
         * not exist in DB, select the first
         * available type.
         */

        if (!finalTypes.includes(type) && finalTypes.length > 0) {
          setType(finalTypes[0]);
        }

        if (isSuperAdmin) {
          try {
            const organizationList = await getOrganizations({
              status: "ACTIVE",
              page: 1,
              limit: 100,
            });

            setOrganizations(
              Array.isArray(organizationList) ? organizationList : [],
            );
          } catch (organizationError) {
            console.warn(
              "Unable to load organizations for master data:",
              organizationError,
            );

            setOrganizations([]);
          }
        } else {
          setOrganizations([]);
        }
      } catch (loadError) {
        console.error("Unable to load master data types:", loadError);

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Unable to load master data types.",
        );
      }
    };

    loadInitialData();
  }, [initialized, authLoading, canView, isSuperAdmin]);

  /* ========================================================
   * LOAD WHEN TYPE / PAGE / SEARCH CHANGES
   * ======================================================== */

  useEffect(() => {
    if (!initialized || authLoading || !canView || !type) {
      return;
    }

    loadData();
  }, [initialized, authLoading, canView, type, page, limit, search, loadData]);

  /* ========================================================
   * SEARCH
   *
   * Reset page when search changes.
   * ======================================================== */

  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ========================================================
   * TYPE CHANGE
   * ======================================================== */

  const handleTypeChange = (event) => {
    const nextType = event.target.value;

    setType(nextType);
    setPage(1);
    setSearch("");
    setStatusFilter("ALL");
    setScopeFilter("ALL");
  };

  /* ========================================================
   * FILTERED DATA
   *
   * Status and scope are intentionally kept
   * client-side because the API already returns
   * the selected page.
   * ======================================================== */

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter === "ACTIVE" && !item.isActive) {
        return false;
      }

      if (statusFilter === "INACTIVE" && item.isActive) {
        return false;
      }

      if (scopeFilter === "SYSTEM" && !item.isSystem) {
        return false;
      }

      if (scopeFilter === "ORGANIZATION" && item.isSystem) {
        return false;
      }

      return true;
    });
  }, [data, statusFilter, scopeFilter]);

  /* ========================================================
   * CREATE
   * ======================================================== */

  const openCreate = () => {
    setEditing(null);
    setError("");
    setModalOpen(true);
  };

  /* ========================================================
   * EDIT
   * ======================================================== */

  const openEdit = (item) => {
    setEditing(item);
    setError("");
    setModalOpen(true);
  };

  /* ========================================================
   * CLOSE FORM MODAL
   * ======================================================== */

  const closeFormModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
  };

  /* ========================================================
   * CREATE / UPDATE
   * ======================================================== */

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await updateMasterData(editing._id, payload);
      } else {
        await createMasterData(payload);
      }

      if (payload?.type && payload.type !== type) {
        setType(payload.type);
        setPage(1);
      }

      setModalOpen(false);
      setEditing(null);

      await loadData({
        requestedPage: page,
        requestedLimit: limit,
        requestedSearch: search,
        requestedType: payload?.type || type,
      });
    } catch (submitError) {
      console.error("Save master data error:", submitError);

      throw submitError;
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
   * STATUS CHANGE REQUEST
   * ======================================================== */

  const handleStatusChange = (item, newIsActive) => {
    if (!item) return;

    if (Boolean(item.isActive) === Boolean(newIsActive)) {
      return;
    }

    setConfirmation({
      action: "STATUS",
      item,
      newIsActive: Boolean(newIsActive),
    });
  };

  /* ========================================================
   * DELETE REQUEST
   * ======================================================== */

  const handleDelete = (item) => {
    if (!item) return;

    setConfirmation({
      action: "DELETE",
      item,
    });
  };

  /* ========================================================
   * CLOSE CONFIRMATION
   * ======================================================== */

  const closeConfirmation = () => {
    if (actionLoading) return;

    setConfirmation(null);
  };

  /* ========================================================
   * CONFIRM ACTION
   * ======================================================== */

  const confirmAction = async () => {
    if (!confirmation?.item?._id) {
      return;
    }

    const { action, item, newIsActive } = confirmation;

    try {
      setActionLoading(true);
      setError("");

      if (action === "STATUS") {
        await updateMasterDataStatus(item._id, newIsActive);
      }

      if (action === "DELETE") {
        await deleteMasterData(item._id);
      }

      setConfirmation(null);

      await loadData();
    } catch (actionError) {
      console.error(`Master data ${action.toLowerCase()} error:`, actionError);

      setError(
        actionError?.response?.data?.message ||
          actionError?.message ||
          `Unable to ${
            action === "DELETE" ? "delete master data" : "update status"
          }.`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ========================================================
   * CLEAR FILTERS
   * ======================================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setScopeFilter("ALL");
    setPage(1);
  };

  /* ========================================================
   * PAGE SIZE
   * ======================================================== */

  const handleLimitChange = (event) => {
    const nextLimit = Number(event.target.value);

    setLimit(nextLimit);
    setPage(1);
  };

  /* ========================================================
   * PAGINATION
   * ======================================================== */

  const goToPreviousPage = () => {
    if (pagination.hasPreviousPage && !loading) {
      setPage((current) => Math.max(1, current - 1));
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && !loading) {
      setPage((current) => current + 1);
    }
  };

  /* ========================================================
   * LOADING
   * ======================================================== */

  if (!initialized || authLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  /* ========================================================
   * ACCESS DENIED
   * ======================================================== */

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You do not have permission to access Master Data.
        </div>
      </div>
    );
  }

  /* ========================================================
   * PAGE
   * ======================================================== */

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Master Data</h1>

          <p className="mt-1 text-sm text-slate-500">
            Centralized lists used across NCR, CAPA, Audits, Suppliers,
            Documents and Training.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Add Master Data
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-medium text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* FILTERS */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-5">
          {/* MASTER TYPE */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Master Type
            </span>

            <select
              value={type}
              onChange={handleTypeChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              {typeOptions.map((masterType) => (
                <option key={masterType.value} value={masterType.value}>
                  {masterType.label}
                </option>
              ))}
            </select>
          </label>

          {/* SEARCH */}

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Search
            </span>

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by code, name, description or organization..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </label>

          {/* STATUS */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="ALL">All Status</option>

              <option value="ACTIVE">Active</option>

              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          {/* SCOPE */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Scope
            </span>

            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="ALL">All Scopes</option>

              <option value="SYSTEM">System</option>

              <option value="ORGANIZATION">Organization</option>
            </select>
          </label>
        </div>

        {/* FILTER FOOTER */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {filteredData.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {pagination.total}
            </span>{" "}
            record(s)
          </div>

          {(search || statusFilter !== "ALL" || scopeFilter !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* CURRENT TYPE */}

      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedLabel}
          </h2>

          <p className="text-xs text-slate-500">
            Page {pagination.totalPages ? pagination.page : 0} of{" "}
            {pagination.totalPages || 0}
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Master Type is selected from the database.
        </div>
      </div>

      {/* TABLE */}

      <MasterDataTable
        data={filteredData}
        loading={loading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canStatusUpdate={canStatusUpdate}
        statusUpdatingId={
          actionLoading && confirmation?.action === "STATUS"
            ? confirmation?.item?._id
            : null
        }
        onEdit={openEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* PAGINATION */}

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT */}

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-slate-500">
              Total{" "}
              <span className="font-medium text-slate-700">
                {pagination.total}
              </span>{" "}
              record(s)
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rows per page</span>

              <select
                value={limit}
                onChange={handleLimitChange}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-500 disabled:bg-slate-50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={loading || !pagination.hasPreviousPage}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <div className="min-w-[90px] text-center text-xs text-slate-500">
              Page{" "}
              <span className="font-medium text-slate-700">
                {pagination.totalPages ? pagination.page : 0}
              </span>{" "}
              /{" "}
              <span className="font-medium text-slate-700">
                {pagination.totalPages || 0}
              </span>
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={loading || !pagination.hasNextPage}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* FORM MODAL */}

      <MasterDataFormModal
        open={modalOpen}
        item={editing}
        type={type}
        organizations={organizations}
        isSuperAdmin={isSuperAdmin}
        loading={saving}
        onClose={closeFormModal}
        onSubmit={async (payload) => {
          await handleSubmit(payload);
        }}
      />

      {/* CONFIRMATION MODAL */}

      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="master-data-confirmation-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2
                  id="master-data-confirmation-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {confirmation.action === "DELETE"
                    ? "Confirm Delete"
                    : "Confirm Status Change"}
                </h2>

                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={actionLoading}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="space-y-4 px-6 py-5">
              {confirmation.action === "DELETE" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.item.name}
                    </span>
                    ?
                  </p>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-red-600">⚠</div>

                      <div>
                        <div className="text-sm font-medium text-red-800">
                          This action cannot be undone.
                        </div>

                        <div className="mt-1 text-xs leading-5 text-red-700">
                          The master data record will be removed from the system
                          and this action will be recorded in the audit log.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Are you sure you want to change the status of{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.item.name}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.newIsActive ? "Active" : "Inactive"}
                    </span>
                    ?
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-slate-400">Code</div>

                        <div className="mt-1 font-mono font-medium text-slate-700">
                          {confirmation.item.code}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400">Current Status</div>

                        <div className="mt-1 font-medium text-slate-700">
                          {confirmation.item.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!confirmation.newIsActive && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-700">
                      Inactive master data may no longer be available for new
                      transactions where only active values are allowed.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAction}
                disabled={actionLoading}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmation.action === "DELETE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {actionLoading
                  ? confirmation.action === "DELETE"
                    ? "Deleting..."
                    : "Updating..."
                  : confirmation.action === "DELETE"
                    ? "Delete"
                    : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
