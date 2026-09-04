"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import TrainingFormModal from "@/components/training/TrainingFormModal";
import TrainingTable from "@/components/training/TrainingTable";
import TrainingStatusModal from "@/components/training/TrainingStatusModal";
import TrainingDetailsModal from "@/components/training/TrainingDetailsModal";
import TrainingDeleteConfirmModal from "@/components/training/TrainingDeleteConfirmModal";
import TrainingAuditLog from "@/components/training/TrainingAuditLog";
import {
  createTraining,
  deleteTraining,
  getTrainings,
  updateTraining,
  updateTrainingStatus,
} from "@/lib/api/training.api";
export default function TrainingsPage() {
  const { user, hasPermission, hasRole } = useAuth();
  const [records, setRecords] = useState([]),
    [filters, setFilters] = useState({
      search: "",
      status: "",
      trainingType: "",
      department: "",
    }),
    [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [modal, setModal] = useState({ type: "", record: null });
  const isSuper =
    String(user?.role || "").toUpperCase() === "SUPER_ADMIN" ||
    hasRole?.("SUPER_ADMIN");
  const canView = Boolean(
    hasPermission?.("TRAINING_VIEW") ||
    isSuper ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canCreate = Boolean(
    hasPermission?.("TRAINING_CREATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canEdit = Boolean(
    hasPermission?.("TRAINING_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canDelete = Boolean(
    hasPermission?.("TRAINING_DELETE") || hasRole?.("ORG_ADMIN"),
  );
  const canStatus = Boolean(
    hasPermission?.("TRAINING_STATUS_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const organizationId = useMemo(
    () => String(user?.organizationId?._id || user?.organizationId || ""),
    [user],
  );
  const load = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError("");
      try {
        const r = await getTrainings({
          ...filters,
          page,
          limit: pagination.limit,
        });
        const d = r?.data || r || {};
        setRecords(d.trainings || d.records || []);
        if (d.pagination) setPagination(d.pagination);
      } catch (e) {
        setRecords([]);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to load trainings.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.limit],
  );
  useEffect(() => {
    if (canView) load(1);
  }, [
    canView,
    filters.search,
    filters.status,
    filters.trainingType,
    filters.department,
  ]);
  const flash = (setter, msg) => {
    setter(msg);
    window.setTimeout(() => setter(""), 5000);
  };
  const save = async (data) => {
    setSaving(true);
    try {
      if (modal.record) await updateTraining(modal.record._id, data);
      else await createTraining(data);
      setModal({ type: "", record: null });
      flash(setMessage, "Training saved successfully.");
      await load(pagination.page);
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    setSaving(true);
    try {
      await deleteTraining(modal.record._id);
      setModal({ type: "", record: null });
      flash(setMessage, "Training deleted successfully.");
      await load(pagination.page);
    } catch (e) {
      flash(
        setError,
        e?.response?.data?.message ||
          e?.message ||
          "Unable to delete training.",
      );
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = async (data) => {
    setSaving(true);
    try {
      await updateTrainingStatus(modal.record._id, data);
      setModal({ type: "", record: null });
      flash(setMessage, "Training status updated successfully.");
      await load(pagination.page);
    } catch (e) {
      flash(
        setError,
        e?.response?.data?.message || e?.message || "Unable to update status.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (!canView)
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          You do not have permission to access Trainings.
        </div>
      </div>
    );
  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Trainings</h1>
          <p className="text-sm text-slate-500">QMS training management.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setModal({ type: "form", record: null })}
            className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white"
          >
            + New Training
          </button>
        )}
      </div>
      {message && (
        <div className="flex justify-between rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
      {error && (
        <div className="flex justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <input
          name="search"
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          placeholder="Search..."
          className="rounded-xl border px-3 py-2.5 text-sm"
        />
        <QMSReferenceSelect
          sourceType="QMS_STATUS"
          name="status"
          label=""
          module="TRAINING"
          value={filters.status}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: e.target.value }))
          }
          organizationId={organizationId}
          placeholder="All statuses"
        />
        <QMSReferenceSelect
          sourceType="TRAINING_TYPE"
          name="trainingType"
          label=""
          module="TRAINING"
          value={filters.trainingType}
          onChange={(e) =>
            setFilters((p) => ({ ...p, trainingType: e.target.value }))
          }
          organizationId={organizationId}
          placeholder="All types"
        />
        <QMSReferenceSelect
          sourceType="DEPARTMENT"
          name="department"
          label=""
          module="TRAINING"
          value={filters.department}
          onChange={(e) =>
            setFilters((p) => ({ ...p, department: e.target.value }))
          }
          organizationId={organizationId}
          placeholder="All departments"
        />
      </div>
      {loading ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <TrainingTable
          records={records}
          canEdit={canEdit}
          canDelete={canDelete}
          canStatus={canStatus}
          onEdit={(r) => setModal({ type: "form", record: r })}
          onDelete={(r) => setModal({ type: "delete", record: r })}
          onStatus={(r) => setModal({ type: "status", record: r })}
          onDetails={(r) => setModal({ type: "details", record: r })}
          onHistory={(r) => setModal({ type: "history", record: r })}
        />
      )}
      <div className="flex justify-between rounded-xl border bg-white px-4 py-3 text-sm">
        <span>{pagination.total || 0} record(s)</span>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1 || loading}
            onClick={() => load(pagination.page - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </span>
          <button
            disabled={
              pagination.page >= (pagination.totalPages || 1) || loading
            }
            onClick={() => load(pagination.page + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <TrainingFormModal
        open={modal.type === "form"}
        training={modal.record}
        user={user}
        saving={saving}
        onClose={() => setModal({ type: "", record: null })}
        onSubmit={save}
      />
      <TrainingStatusModal
        open={modal.type === "status"}
        record={modal.record}
        organizationId={organizationId}
        saving={saving}
        onClose={() => setModal({ type: "", record: null })}
        onSubmit={changeStatus}
      />
      <TrainingDetailsModal
        open={modal.type === "details"}
        record={modal.record}
        onClose={() => setModal({ type: "", record: null })}
      />
      <TrainingDeleteConfirmModal
        open={modal.type === "delete"}
        record={modal.record}
        loading={saving}
        onClose={() => setModal({ type: "", record: null })}
        onConfirm={remove}
      />
      <TrainingAuditLog
        open={modal.type === "history"}
        record={modal.record}
        onClose={() => setModal({ type: "", record: null })}
      />
    </div>
  );
}
