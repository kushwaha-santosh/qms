"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthProvider";

import {
  getAudits,
  createAudit,
  updateAudit,
  getAuditById,
  updateAuditStatus,
  deleteAudit,
} from "@/lib/api/audits.api";

import AuditTable from "@/components/audits/AuditTable";
import AuditFormModal from "@/components/audits/AuditFormModal";
import AuditDetailsModal from "@/components/audits/AuditDetailsModal";
import AuditStatusModal from "@/components/audits/AuditStatusModal";
import AuditAuditLog from "@/components/audits/AuditAuditLog";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

export default function AuditsPage() {
  const { hasPermission, hasRole, user } = useAuth();

  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    auditType: "",
    department: "",
  });

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    totalPages: 1,
  });

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selected, setSelected] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);

  const [statusAudit, setStatusAudit] = useState(null);

  const [auditOpen, setAuditOpen] = useState(false);

  const [auditLogRecord, setAuditLogRecord] = useState(null);

  // ========================================================
  // DELETE MODAL
  // ========================================================

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleteAuditRecord, setDeleteAuditRecord] = useState(null);

  // ========================================================
  // PERMISSIONS
  // ========================================================

  const superAdmin =
    String(user?.role || "").toUpperCase() === "SUPER_ADMIN" ||
    hasRole?.("SUPER_ADMIN");

  const canCreate =
    hasPermission?.("AUDIT_CREATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER") ||
    hasRole?.("AUDITOR");

  const canEdit =
    hasPermission?.("AUDIT_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER") ||
    hasRole?.("AUDITOR");

  const canDelete = hasPermission?.("AUDIT_DELETE") || hasRole?.("ORG_ADMIN");

  const canStatus = canEdit;

  // ========================================================
  // LOAD
  // ========================================================

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAudits({
        ...filters,
        page,
        limit: 10,
      });

      const data = response?.data || response;

      const audits = data?.audits || data?.records || [];

      const paging = data?.pagination || {};

      setRecords(Array.isArray(audits) ? audits : []);

      setPagination({
        total: Number(paging?.total || 0),

        pages: Number(paging?.pages || paging?.totalPages || 1),

        totalPages: Number(paging?.totalPages || paging?.pages || 1),
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load audits.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  // ========================================================
  // FILTER
  // ========================================================

  const filter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  };

  // ========================================================
  // VIEW
  // ========================================================

  const view = async (audit) => {
    if (!audit?._id) {
      setError("Invalid audit ID.");
      return;
    }

    setSelected(audit);
    setDetailsOpen(true);

    try {
      const response = await getAuditById(audit._id);

      const record = response?.audit || response?.data?.audit || response;

      setSelected(record);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load audit.",
      );
    }
  };

  // ========================================================
  // EDIT
  // ========================================================

  const edit = async (audit) => {
    if (!audit?._id) {
      setError("Invalid audit ID.");
      return;
    }

    try {
      const response = await getAuditById(audit._id);

      const record = response?.audit || response?.data?.audit || response;

      setEditing(record);
      setFormOpen(true);
      setDetailsOpen(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load audit.",
      );
    }
  };

  // ========================================================
  // SAVE
  // ========================================================

  const save = async (payload) => {
    setBusy(true);
    setError("");

    try {
      if (editing?._id) {
        await updateAudit(editing._id, payload);
      } else {
        await createAudit(payload);
      }

      setFormOpen(false);
      setEditing(null);

      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to save audit.",
      );

      throw requestError;
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // CHANGE STATUS
  // ========================================================

  const changeStatus = async (payload) => {
    if (!statusAudit?._id) {
      throw new Error("Invalid audit ID.");
    }

    setBusy(true);
    setError("");

    try {
      await updateAuditStatus(statusAudit._id, {
        status: payload.status,
        comment: payload.comment || "",
      });

      setStatusOpen(false);
      setStatusAudit(null);

      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to update audit status.",
      );

      throw requestError;
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // OPEN DELETE MODAL
  // ========================================================

  const remove = (audit) => {
    if (!audit?._id) {
      setError("Invalid audit ID.");
      return;
    }

    setDeleteAuditRecord(audit);
    setDeleteOpen(true);
  };

  // ========================================================
  // CONFIRM DELETE
  // ========================================================

  const confirmDelete = async () => {
    if (!deleteAuditRecord?._id) {
      setError("Invalid audit ID.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteAudit(deleteAuditRecord._id);

      setDeleteOpen(false);
      setDeleteAuditRecord(null);

      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to delete audit.",
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Audits</h1>

          <p className="mt-1 text-sm text-slate-500">
            Plan, execute and close quality audits.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white"
          >
            + Create Audit
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* KPI */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <K label="Total Audits" value={pagination.total} />

        <K
          label="Open"
          value={
            records.filter(
              (item) => String(item?.status || "").toUpperCase() === "OPEN",
            ).length
          }
        />

        <K
          label="In Progress"
          value={
            records.filter(
              (item) =>
                String(item?.status || "")
                  .toUpperCase()
                  .replaceAll("-", "_")
                  .replaceAll(" ", "_") === "IN_PROGRESS",
            ).length
          }
        />

        <K
          label="Overdue"
          value={
            records.filter(
              (item) =>
                item?.dueDate &&
                !["COMPLETED", "CLOSED"].includes(
                  String(item?.status || "").toUpperCase(),
                ) &&
                new Date(item.dueDate) < new Date(),
            ).length
          }
        />
      </div>

      {/* FILTERS */}

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => filter("search", event.target.value)}
            placeholder="Search audits..."
            className="rounded-xl border px-3 py-2.5 text-sm"
          />

          <QMSReferenceSelect
            name="status"
            sourceType="QMS_STATUS"
            module="AUDIT"
            value={filters.status}
            onChange={(event) => filter("status", event.target.value)}
            placeholder="All statuses"
          />

          <QMSReferenceSelect
            name="auditType"
            sourceType="AUDIT_TYPE"
            module="AUDIT"
            value={filters.auditType}
            onChange={(event) => filter("auditType", event.target.value)}
            placeholder="All audit types"
          />

          <QMSReferenceSelect
            name="department"
            sourceType="DEPARTMENT"
            module="AUDIT"
            value={filters.department}
            onChange={(event) => filter("department", event.target.value)}
            placeholder="All departments"
          />

          <button
            onClick={() => {
              setFilters({
                search: "",
                status: "",
                auditType: "",
                department: "",
              });

              setPage(1);
            }}
            className="rounded-xl border px-4 py-2.5"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* TABLE */}

      <AuditTable
        audits={records}
        loading={loading}
        isSuperAdmin={superAdmin}
        canEdit={canEdit}
        canDelete={canDelete}
        canStatus={canStatus}
        onView={view}
        onEdit={edit}
        onStatus={(audit) => {
          if (!audit?._id) {
            setError("Invalid audit ID.");
            return;
          }

          setStatusAudit(audit);
          setStatusOpen(true);
        }}
        onAudit={(audit) => {
          if (!audit?._id) {
            setError("Invalid audit ID.");
            return;
          }

          setAuditLogRecord(audit);
          setAuditOpen(true);
        }}
        onDelete={remove}
      />

      {/* PAGINATION */}

      <div className="flex justify-between rounded-2xl border bg-white px-4 py-3 text-xs">
        <span>
          Page {page} of {pagination.pages || 1}
          {" · "}
          {pagination.total || 0} total
        </span>

        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= (pagination.pages || 1)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* CREATE / EDIT */}

      <AuditFormModal
        open={formOpen}
        audit={editing}
        loading={busy}
        onClose={() => !busy && setFormOpen(false)}
        onSubmit={save}
      />

      {/* DETAILS */}

      <AuditDetailsModal
        open={detailsOpen}
        audit={selected}
        loading={false}
        canEdit={canEdit}
        canChangeStatus={canStatus}
        onClose={() => setDetailsOpen(false)}
        onEdit={edit}
        onStatus={(audit) => {
          if (!audit?._id) {
            setError("Invalid audit ID.");
            return;
          }

          setStatusAudit(audit);
          setStatusOpen(true);
        }}
      />

      {/* STATUS */}

      <AuditStatusModal
        open={statusOpen}
        audit={statusAudit}
        loading={busy}
        onClose={() => !busy && setStatusOpen(false)}
        onSubmit={changeStatus}
      />

      {/* HISTORY */}

      <AuditAuditLog
        open={auditOpen}
        audit={auditLogRecord}
        onClose={() => setAuditOpen(false)}
      />

      {/* DELETE CONFIRMATION */}

      <DeleteAuditModal
        open={deleteOpen}
        audit={deleteAuditRecord}
        loading={busy}
        onClose={() => {
          if (!busy) {
            setDeleteOpen(false);
            setDeleteAuditRecord(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ==========================================================
// KPI
// ==========================================================

function K({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-xs font-semibold uppercase text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

// ==========================================================
// DELETE MODAL
// ==========================================================

function DeleteAuditModal({
  open,
  audit,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Delete Audit</h2>

          <p className="mt-1 text-sm text-slate-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-700">
            Are you sure you want to delete audit{" "}
            <span className="font-semibold">
              {audit?.auditNumber || audit?.title || "this audit"}
            </span>
            ?
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Audit"}
          </button>
        </div>
      </div>
    </div>
  );
}
