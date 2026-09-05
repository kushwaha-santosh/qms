"use client";

import { DataTablePagination } from "@/components/common/data-table";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createNCR,
  deleteNCR,
  getNCRById,
  getNCRs,
  updateNCR,
  updateNCRStatus,
} from "@/lib/api/ncr.api";

import { useAuth } from "@/context/AuthProvider";

import NCRTable from "./NCRTable";
import NCRFormModal from "./NCRFormModal";
import NCRDetailsModal from "./NCRDetailsModal";
import NCRStatusModal from "./NCRStatusConfirmModal";
import NCRAuditLog from "./NCRAuditLog";
import NCRDeleteConfirmModal from "./NCRDeleteConfirmModal";
import { getOrganizations } from "@/lib/api/organization.api";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

const EMPTY = {
  search: "",
  status: "",
  severity: "",
  category: "",
  source: "",
  department: "",
  process: "",
  organizationId: "",
};

const PAGE_SIZE = 10;

export default function NCRPage() {
  const { hasRole, hasPermission, user, currentUser } = useAuth();

  const authUser = currentUser || user;

  const isSuperAdmin =
    authUser?.role === "SUPER_ADMIN" || hasRole?.("SUPER_ADMIN");

  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(EMPTY);

  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusNCR, setStatusNCR] = useState(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditNCR, setAuditNCR] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNCRState, setDeleteNCRState] = useState(null);

  const canCreate =
    hasPermission?.("NCR_CREATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER");

  const canEdit =
    hasPermission?.("NCR_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER");

  const canDelete = hasPermission?.("NCR_DELETE") || hasRole?.("ORG_ADMIN");

  const canStatus =
    hasPermission?.("NCR_STATUS_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER");

  const canView = hasPermission?.("NCR_VIEW") === true;

  /*
   * ----------------------------------------------------------
   * LOAD ORGANIZATIONS
   * ----------------------------------------------------------
   *
   * Only SUPER_ADMIN needs the organization list.
   *
   * IMPORTANT:
   * Replace the import/API below with the organization-list
   * function already used in your Administration/Organizations
   * page if its name differs.
   * ----------------------------------------------------------
   */

  useEffect(() => {
    if (!isSuperAdmin) {
      setOrganizations([]);
      return;
    }

    let mounted = true;

    const loadOrganizations = async () => {
      setOrganizationsLoading(true);

      try {
        const response = await getOrganizations();

        const data = response?.data || response;

        const list =
          data?.organizations ||
          data?.records ||
          data?.data ||
          (Array.isArray(data) ? data : []);

        if (mounted) {
          setOrganizations(list);
        }
      } catch (e) {
        if (mounted) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to load organizations.",
          );
        }
      } finally {
        if (mounted) {
          setOrganizationsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      mounted = false;
    };
  }, [isSuperAdmin]);

  /*
   * ----------------------------------------------------------
   * LOAD NCR
   * ----------------------------------------------------------
   */

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        search: filters.search,
        status: filters.status,
        severity: filters.severity,
        category: filters.category,
        source: filters.source,
        department: filters.department,
        process: filters.process,
        page,
        limit: PAGE_SIZE,
      };

      /*
       * SUPER_ADMIN:
       *
       * organizationId is sent only when an organization
       * has been selected.
       *
       * Empty organizationId means ALL organizations.
       */
      if (isSuperAdmin && filters.organizationId) {
        params.organizationId = filters.organizationId;
      }

      const r = await getNCRs(params);

      const d = r?.data || r;

      setNcrs(d?.ncrs || d?.records || (Array.isArray(d) ? d : []));

      setPagination(
        d?.pagination || {
          total: Array.isArray(d) ? d.length : 0,
          totalPages: 1,
          page,
          limit: PAGE_SIZE,
        },
      );
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load NCR records.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * ----------------------------------------------------------
   * FILTER CHANGE
   * ----------------------------------------------------------
   */

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY);
    setPage(1);
  };

  /*
   * ----------------------------------------------------------
   * GET FULL NCR
   * ----------------------------------------------------------
   */

  const getFull = async (n) => {
    const r = await getNCRById(n._id);

    return r?.ncr || r?.record || r;
  };

  /*
   * ----------------------------------------------------------
   * VIEW
   * ----------------------------------------------------------
   */

  const view = async (n) => {
    setSelected(n);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      setSelected(await getFull(n));
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load NCR details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * EDIT
   * ----------------------------------------------------------
   */

  const edit = async (n) => {
    setDetailsOpen(false);
    setActionLoading(true);

    try {
      setEditing(await getFull(n));

      setFormOpen(true);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to load NCR.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * SUBMIT
   * ----------------------------------------------------------
   */

  const submit = async (p) => {
    setActionLoading(true);

    try {
      if (editing) {
        await updateNCR(editing._id, p);
      } else {
        await createNCR(p);
      }

      setFormOpen(false);
      setEditing(null);

      await load();
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * STATUS
   * ----------------------------------------------------------
   */

  const status = (n) => {
    setStatusNCR(n);
    setStatusOpen(true);
  };

  const statusSubmit = async (p) => {
    setActionLoading(true);

    try {
      await updateNCRStatus(statusNCR._id, p);

      setStatusOpen(false);

      const id = statusNCR._id;

      setStatusNCR(null);

      await load();

      if (selected?._id === id) {
        await view({
          _id: id,
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * DELETE
   * ----------------------------------------------------------
   */

  const askDelete = (n) => {
    setDeleteNCRState(n);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setActionLoading(true);

    try {
      await deleteNCR(deleteNCRState._id);

      setDeleteOpen(false);
      setDeleteNCRState(null);

      await load();
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to delete NCR.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ----------------------------------------------------------
   * AUDIT
   * ----------------------------------------------------------
   */

  const audit = (n) => {
    setAuditNCR(n);
    setAuditOpen(true);
  };

  /*
   * ----------------------------------------------------------
   * KPI
   * ----------------------------------------------------------
   */

  const k = useMemo(
    () => ({
      total: pagination.total || 0,

      open: ncrs.filter((x) => x.status === "OPEN").length,

      critical: ncrs.filter((x) => x.severity === "CRITICAL").length,

      overdue: ncrs.filter(
        (x) =>
          x.dueDate &&
          !["CLOSED", "CANCELLED"].includes(x.status) &&
          new Date(x.dueDate) < new Date(),
      ).length,
    }),
    [ncrs, pagination.total],
  );

  if (!canView) {
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

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Non-Conformances</h1>

          <p className="mt-1 text-sm text-gray-500">
            Identify, investigate and manage quality non-conformances.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Create NCR
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      {/* KPI */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total NCR", k.total],
          ["Open", k.open],
          ["Critical", k.critical],
          ["Overdue", k.overdue],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border bg-white p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">
              {a}
            </div>

            <div className="mt-2 text-2xl font-bold">{b}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}

      <div className="rounded-2xl border bg-white p-4">
        <div
          className={`grid gap-3 ${
            isSuperAdmin
              ? "md:grid-cols-2 lg:grid-cols-6"
              : "md:grid-cols-2 lg:grid-cols-5"
          }`}
        >
          {/* SEARCH */}

          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search NCR..."
            className="rounded-xl border px-3 py-2.5 text-sm"
          />

          {/* ORGANIZATION - SUPER ADMIN ONLY */}

          {isSuperAdmin && (
            <select
              value={filters.organizationId}
              onChange={(e) => updateFilter("organizationId", e.target.value)}
              disabled={organizationsLoading}
              className="rounded-xl border bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                {organizationsLoading
                  ? "Loading organizations..."
                  : "All organizations"}
              </option>

              {organizations.map((org) => {
                const id = org._id || org.id;

                const name =
                  org.name || org.displayName || org.companyName || id;

                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          )}

          {/* STATUS */}

          <QMSReferenceSelect
            name="status"
            sourceType="QMS_STATUS"
            module="NCR"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All statuses"
          />

          {/* SEVERITY */}

          <QMSReferenceSelect
            name="severity"
            sourceType="QMS_SEVERITY"
            module="NCR"
            value={filters.severity}
            onChange={(e) => updateFilter("severity", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All severities"
          />

          {/* CATEGORY */}

          <QMSReferenceSelect
            name="category"
            sourceType="QMS_CATEGORY"
            module="NCR"
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All categories"
          />

          {/* SOURCE */}

          <QMSReferenceSelect
            name="source"
            sourceType="QMS_SOURCE"
            module="NCR"
            value={filters.source}
            onChange={(e) => updateFilter("source", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All sources"
          />

          <QMSReferenceSelect
            name="department"
            sourceType="DEPARTMENT"
            module="NCR"
            value={filters.department}
            onChange={(e) => updateFilter("department", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All departments"
          />

          <QMSReferenceSelect
            name="process"
            sourceType="PROCESS"
            module="NCR"
            value={filters.process}
            onChange={(e) => updateFilter("process", e.target.value)}
            organizationId={filters.organizationId}
            placeholder="All processes"
          />

          {/* CLEAR */}

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border px-4 py-2.5"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* TABLE */}

      <NCRTable
        ncrs={ncrs}
        loading={loading}
        isSuperAdmin={isSuperAdmin}
        canEdit={canEdit}
        canDelete={canDelete}
        canChangeStatus={canStatus}
        onView={view}
        onEdit={edit}
        onStatus={status}
        onAudit={audit}
        onDelete={askDelete}
      />

      <DataTablePagination
        pagination={pagination}
        loading={loading}
        onPageChange={setPage}
        entityLabel="NCR records"
      />

      {/* MODALS */}

      <NCRFormModal
        open={formOpen}
        ncr={editing}
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        onSubmit={submit}
      />

      <NCRDetailsModal
        open={detailsOpen}
        ncr={selected}
        loading={detailsLoading}
        canEdit={canEdit}
        canChangeStatus={canStatus}
        onClose={() => setDetailsOpen(false)}
        onEdit={edit}
        onStatus={status}
      />

      <NCRStatusModal
        open={statusOpen}
        ncr={statusNCR}
        loading={actionLoading}
        onClose={() => !actionLoading && setStatusOpen(false)}
        onSubmit={statusSubmit}
      />

      <NCRAuditLog
        open={auditOpen}
        ncr={auditNCR}
        onClose={() => setAuditOpen(false)}
      />

      <NCRDeleteConfirmModal
        open={deleteOpen}
        ncr={deleteNCRState}
        loading={actionLoading}
        onClose={() => !actionLoading && setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Filter({ value, onChange, opts, ph }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border bg-white px-3 py-2.5 text-sm"
    >
      <option value="">{ph}</option>

      {opts.map((x) => (
        <option key={x} value={x}>
          {x.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
