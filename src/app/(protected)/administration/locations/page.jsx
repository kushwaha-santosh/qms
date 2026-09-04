"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import {
  getLocations,
  createLocation,
  updateLocation,
  updateLocationStatus,
  deleteLocation,
} from "@/lib/api/location.api";
import LocationTable from "@/components/locations/LocationTable";
import LocationFormModal from "@/components/locations/LocationFormModal";
import LocationPagination from "@/components/locations/LocationPagination";
import toastService from "@/services/toastService/toast.service";

const LOCATION_TYPES = [
  {
    value: "COUNTRY",
    label: "Country",
  },
  {
    value: "STATE",
    label: "State / UT",
  },
  {
    value: "DISTRICT",
    label: "District",
  },
  {
    value: "CITY",
    label: "City",
  },
  {
    value: "PINCODE",
    label: "Pincode",
  },
];

const PARENT_TYPES = {
  COUNTRY: null,
  STATE: "COUNTRY",
  DISTRICT: "STATE",
  CITY: "DISTRICT",
  PINCODE: "CITY",
};

// const PERMISSIONS = {
//   VIEW: "LOCATION_VIEW",
//   CREATE: "LOCATION_CREATE",
//   UPDATE: "LOCATION_UPDATE",
//   DELETE: "LOCATION_DELETE",
//   STATUS: "LOCATION_STATUS_UPDATE",
// };

export default function LocationsPage() {
  const {
    user,
    permissions = [],
    initialized,
    loading: authLoading,
  } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  /*
   * ==========================================================
   * PERMISSION
   * ==========================================================
   */

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

  // const hasPermission = useCallback(
  //   (permission) => {
  //     if (isSuperAdmin) {
  //       return true;
  //     }

  //     const required = String(permission || "")
  //       .trim()
  //       .toUpperCase();

  //     return permissions.some(
  //       (item) =>
  //         String(item?.key || item?.code || item || "")
  //           .trim()
  //           .toUpperCase() === required,
  //     );
  //   },
  //   [isSuperAdmin, permissions],
  // );

  // // LOCATION_VIEW: "LOCATION_VIEW",
  // // LOCATION_CREATE: "LOCATION_CREATE",
  // // LOCATION_UPDATE: "LOCATION_UPDATE",
  // // LOCATION_DELETE: "LOCATION_DELETE",
  // // LOCATION_STATUS_UPDATE: "LOCATION_STATUS_UPDATE",

  const canView = hasPermission("LOCATION_VIEW");
  const canCreate = hasPermission("LOCATION_CREATE");
  const canUpdate = hasPermission("LOCATION_UPDATE");
  const canDelete = hasPermission("LOCATION_DELETE");
  const canStatusUpdate = hasPermission("LOCATION_STATUS_UPDATE");

  // const canView = hasPermission(PERMISSIONS.VIEW);

  // const canCreate = hasPermission(PERMISSIONS.CREATE);

  // const canUpdate = hasPermission(PERMISSIONS.UPDATE);

  // const canDelete = hasPermission(PERMISSIONS.DELETE);

  // const canStatusUpdate = hasPermission(PERMISSIONS.STATUS);

  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [type, setType] = useState("");

  const [parentId, setParentId] = useState("");

  const [parentOptions, setParentOptions] = useState([]);

  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [confirmation, setConfirmation] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  /*
   * ==========================================================
   * SELECTED LABEL
   * ==========================================================
   */

  const selectedTypeLabel = useMemo(
    () => LOCATION_TYPES.find((item) => item.value === type)?.label || type,
    [type],
  );

  /*
   * ==========================================================
   * LOAD PARENT OPTIONS
   * ==========================================================
   */

  const loadParentOptions = useCallback(async () => {
    const parentType = PARENT_TYPES[type];

    if (!parentType) {
      setParentOptions([]);
      return;
    }

    try {
      const response = await getLocations({
        type: parentType,

        isActive: true,

        page: 1,

        limit: 100,
      });

      setParentOptions(Array.isArray(response?.data) ? response.data : []);
    } catch (parentError) {
      console.error("Unable to load parent locations:", parentError);

      setParentOptions([]);
    }
  }, [type]);

  useEffect(() => {
    if (!initialized || authLoading || !canView) {
      return;
    }

    loadParentOptions();
  }, [initialized, authLoading, canView, loadParentOptions]);

  /*
   * ==========================================================
   * LOAD DATA
   * ==========================================================
   */

  const loadData = useCallback(
    async (requestedPage = page) => {
      if (!canView) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getLocations({
          type,

          parentId: parentId || undefined,

          search,

          isActive: statusFilter === "ALL" ? "" : statusFilter === "ACTIVE",

          page: requestedPage,

          limit: 20,
        });

        setData(Array.isArray(response?.data) ? response.data : []);

        setPagination(
          response?.pagination || {
            page: requestedPage,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (loadError) {
        console.error("Unable to load locations:", loadError);

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Unable to load locations.",
        );

        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [canView, type, parentId, search, statusFilter, page],
  );

  /*
   * ==========================================================
   * LOAD WHEN FILTER CHANGES
   * ==========================================================
   */

  useEffect(() => {
    if (!initialized || authLoading || !canView) {
      return;
    }

    loadData(page);
  }, [
    initialized,
    authLoading,
    canView,
    type,
    parentId,
    search,
    statusFilter,
    page,
  ]);

  /*
   * ==========================================================
   * RESET PAGE WHEN FILTER CHANGES
   * ==========================================================
   */

  useEffect(() => {
    setPage(1);
  }, [type, parentId, search, statusFilter]);

  /*
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  const openCreate = () => {
    if (!canCreate) {
      return;
    }

    setEditing(null);

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================================
   * EDIT
   * ==========================================================
   */

  const openEdit = (item) => {
    if (!canUpdate) {
      return;
    }

    setEditing(item);

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================================
   * CLOSE FORM
   * ==========================================================
   */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditing(null);
  };

  /*
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  const handleSubmit = async (payload) => {
    setSaving(true);

    setError("");

    try {
      if (editing) {
        const response = await updateLocation(editing._id, payload);
        toastService.success(response.message);
      } else {
        const response = await createLocation(payload);
        toastService.success(response.message);
      }

      setModalOpen(false);

      setEditing(null);

      if (payload?.type && payload.type !== type) {
        setType(payload.type);
      }

      await loadData(page);
    } catch (submitError) {
      toastService.error(submitError || "Unable to save record");
      throw submitError;
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================================
   * STATUS
   * ==========================================================
   */

  const requestStatusChange = (item, nextStatus) => {
    if (!canStatusUpdate) {
      return;
    }

    if (Boolean(item?.isActive) === Boolean(nextStatus)) {
      return;
    }

    setConfirmation({
      action: "STATUS",

      item,

      newIsActive: Boolean(nextStatus),
    });
  };

  /*
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  const requestDelete = (item) => {
    if (!canDelete) {
      return;
    }

    setConfirmation({
      action: "DELETE",
      item,
    });
  };

  /*
   * ==========================================================
   * CONFIRM
   * ==========================================================
   */

  const confirmAction = async () => {
    if (!confirmation?.item?._id) {
      return;
    }

    const { action, item, newIsActive } = confirmation;

    try {
      setActionLoading(true);

      setError("");

      if (action === "STATUS") {
        const response = await updateLocationStatus(item._id, newIsActive);
        toastService.success(response.message);
      }

      if (action === "DELETE") {
        const response = await deleteLocation(item._id);
        toastService.success(response.message);
      }

      setConfirmation(null);

      const currentPage = pagination?.page || 1;

      /*
       * If the last record on a page
       * was deleted, go to previous page.
       */

      const nextPage =
        action === "DELETE" && data.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      setPage(nextPage);

      await loadData(nextPage);
    } catch (actionError) {
      console.error("Location action error:", actionError);

      setError(
        actionError?.response?.data?.message ||
          actionError?.message ||
          "Unable to complete the requested action.",
      );
      toastService.error(
        actionError?.response?.data?.message ||
          actionError?.message ||
          "Unable to complete the requested action.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (!initialized || authLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  /*
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
   */

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You do not have permission to access Location Master.
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Location Master
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage India location hierarchy: Country → State / UT → District →
            City → Pincode.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Add Location
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
            className="font-medium hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* FILTERS */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-4">
          {/* TYPE */}

          {/* SEARCH */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Location Type
            </span>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            >
              {/* <option value="">All</option> */}
              {LOCATION_TYPES.map((locationType) => (
                <option key={locationType.value} value={locationType.value}>
                  {locationType.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Search
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code or pincode..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </label>

          {/* PARENT */}

          {type !== "COUNTRY" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                {PARENT_TYPES[type] === "COUNTRY"
                  ? "Country"
                  : PARENT_TYPES[type] === "STATE"
                    ? "State / UT"
                    : PARENT_TYPES[type] === "DISTRICT"
                      ? "District"
                      : "City"}
              </span>

              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="">All</option>

                {parentOptions.map((parent) => (
                  <option key={parent._id} value={parent._id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* STATUS */}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="ACTIVE">Active</option>

              <option value="INACTIVE">Inactive</option>

              <option value="ALL">All</option>
            </select>
          </label>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {selectedTypeLabel}
          </span>{" "}
          locations.
        </div>
      </div>

      {/* TABLE */}

      <LocationTable
        data={data}
        loading={loading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canStatusUpdate={canStatusUpdate}
        onEdit={openEdit}
        onDelete={requestDelete}
        onStatusChange={requestStatusChange}
      />

      {/* PAGINATION */}

      <LocationPagination
        pagination={pagination}
        loading={loading}
        onPageChange={(nextPage) => {
          setPage(nextPage);
        }}
      />

      {/* FORM */}

      <LocationFormModal
        open={modalOpen}
        item={editing}
        type={type}
        parentOptions={parentOptions}
        loading={saving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      {/* CONFIRMATION */}

      {/* =====================================================
    CONFIRMATION MODAL
    ===================================================== */}

      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-confirmation-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* ==================================================
          HEADER
          ================================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2
                  id="location-confirmation-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {confirmation.action === "DELETE"
                    ? "Confirm Delete"
                    : "Change Location Status"}
                </h2>

                {/* <p className="mt-1 text-xs text-slate-500">
                  {confirmation.item?.name || "Location"}
                </p> */}

                {/* {confirmation.action === "STATUS" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Current:{" "}
                    <span className="font-medium text-slate-700">
                      {confirmation.item?.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                )} */}
              </div>

              <button
                type="button"
                onClick={() => setConfirmation(null)}
                disabled={actionLoading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
          BODY
          ================================================== */}

            <div className="space-y-5 px-6 py-5">
              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              {/* ==================================================
            DELETE CONFIRMATION
            ================================================== */}

              {confirmation.action === "DELETE" ? (
                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.item?.name}
                    </span>
                    ?
                  </p>

                  {/* LOCATION INFORMATION */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          Type
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {confirmation.item?.type || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          Code
                        </div>

                        <div className="mt-1 font-mono text-sm font-semibold text-slate-700">
                          {confirmation.item?.code || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WARNING */}

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-red-600">⚠</div>

                      <div>
                        <div className="text-sm font-medium text-red-800">
                          This action cannot be undone.
                        </div>

                        <div className="mt-1 text-xs leading-5 text-red-700">
                          This location can only be deleted when it has no child
                          locations. The deletion will also be recorded in the
                          audit log.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ==================================================
             STATUS CONFIRMATION
             ================================================== */

                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Are you sure you want to change the status of{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.item?.name}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {confirmation.newIsActive ? "Active" : "Inactive"}
                    </span>
                    ?
                  </p>

                  {/* STATUS INFORMATION */}

                  {/* <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          Location Type
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {confirmation.item?.type || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          Code
                        </div>

                        <div className="mt-1 font-mono text-sm font-semibold text-slate-700">
                          {confirmation.item?.code || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          Current Status
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {confirmation.item?.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-slate-400">
                          New Status
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {confirmation.newIsActive ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* STATUS TRANSITION */}

                  <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Status Change
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {confirmation.item?.isActive ? "Active" : "Inactive"}
                      </span>

                      <svg
                        className="h-4 w-4 shrink-0 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                        {confirmation.newIsActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* INACTIVE WARNING */}

                  {!confirmation.newIsActive && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-amber-600">⚠</div>

                        <div>
                          <div className="text-sm font-medium text-amber-800">
                            Location will become inactive
                          </div>

                          <div className="mt-1 text-xs leading-5 text-amber-700">
                            Inactive locations may no longer be available for
                            new transactions or dependent dropdowns where only
                            active locations are allowed.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ==================================================
          FOOTER
          ================================================== */}

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmAction}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmation.action === "DELETE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-950 hover:bg-slate-800"
                }`}
              >
                {actionLoading
                  ? confirmation.action === "DELETE"
                    ? "Deleting..."
                    : "Updating..."
                  : confirmation.action === "DELETE"
                    ? "Delete"
                    : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
