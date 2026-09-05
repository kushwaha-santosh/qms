"use client";

import { DataTablePagination } from "@/components/common/data-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";

import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import SupplierFormModal from "@/components/suppliers/SupplierFormModal";
import SupplierTable from "@/components/suppliers/SupplierTable";
import SupplierStatusModal from "@/components/suppliers/SupplierStatusModal";
import SupplierDetailsModal from "@/components/suppliers/SupplierDetailsModal";
import SupplierDeleteConfirmModal from "@/components/suppliers/SupplierDeleteConfirmModal";
import SupplierAuditLog from "@/components/suppliers/SupplierAuditLog";

import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
  updateSupplierStatus,
} from "@/lib/api/suppliers.api";

export default function SuppliersPage() {
  const { user, hasPermission, hasRole } = useAuth();

  const [records, setRecords] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    supplierType: "",
    category: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    type: "",
    record: null,
  });

  const isSuper =
    String(user?.role || "").toUpperCase() === "SUPER_ADMIN" ||
    hasRole?.("SUPER_ADMIN");

  const canView = Boolean(
    hasPermission?.("SUPPLIER_VIEW") ||
    isSuper ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );

  const canCreate = Boolean(
    hasPermission?.("SUPPLIER_CREATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );

  const canEdit = Boolean(
    hasPermission?.("SUPPLIER_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );

  const canDelete = Boolean(
    hasPermission?.("SUPPLIER_DELETE") || hasRole?.("ORG_ADMIN"),
  );

  const canStatus = Boolean(
    hasPermission?.("SUPPLIER_STATUS_UPDATE") ||
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
        const r = await getSuppliers({
          ...filters,
          page,
          limit: pagination.limit,
        });

        const d = r?.data || r || {};

        setRecords(d.suppliers || d.records || d.items || []);

        if (d.pagination) {
          setPagination(d.pagination);
        }
      } catch (e) {
        setRecords([]);

        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to load suppliers.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.limit],
  );

  useEffect(() => {
    if (canView) {
      load(1);
    }
  }, [
    canView,
    filters.search,
    filters.status,
    filters.supplierType,
    filters.category,
  ]);

  const flash = (setter, msg) => {
    setter(msg);

    window.setTimeout(() => {
      setter("");
    }, 5000);
  };

  const save = async (data) => {
    setSaving(true);

    try {
      if (modal.record) {
        await updateSupplier(modal.record._id, data);
      } else {
        await createSupplier(data);
      }

      setModal({
        type: "",
        record: null,
      });

      flash(setMessage, "Supplier saved successfully.");

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
      await deleteSupplier(modal.record._id);

      setModal({
        type: "",
        record: null,
      });

      flash(setMessage, "Supplier deleted successfully.");

      await load(pagination.page);
    } catch (e) {
      flash(
        setError,
        e?.response?.data?.message ||
          e?.message ||
          "Unable to delete supplier.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (data) => {
    setSaving(true);

    try {
      await updateSupplierStatus(modal.record._id, data);

      setModal({
        type: "",
        record: null,
      });

      flash(setMessage, "Supplier status updated successfully.");

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

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          You do not have permission to access Suppliers.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>

          <p className="text-sm text-slate-500">QMS supplier management.</p>
        </div>

        {canCreate && (
          <button
            onClick={() =>
              setModal({
                type: "form",
                record: null,
              })
            }
            className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white"
          >
            + New Supplier
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
            setFilters((p) => ({
              ...p,
              search: e.target.value,
            }))
          }
          placeholder="Search..."
          className="rounded-xl border px-3 py-2.5 text-sm"
        />

        <QMSReferenceSelect
          sourceType="QMS_STATUS"
          name="status"
          label=""
          module="SUPPLIER"
          value={filters.status}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              status: e.target.value,
            }))
          }
          organizationId={organizationId}
          placeholder="All statuses"
        />

        <QMSReferenceSelect
          sourceType="SUPPLIER_TYPE"
          name="supplierType"
          label=""
          module="SUPPLIER"
          value={filters.supplierType}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              supplierType: e.target.value,
            }))
          }
          organizationId={organizationId}
          placeholder="All types"
        />

        <QMSReferenceSelect
          sourceType="QMS_CATEGORY"
          name="category"
          label=""
          module="SUPPLIER"
          value={filters.category}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              category: e.target.value,
            }))
          }
          organizationId={organizationId}
          placeholder="All categories"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <SupplierTable
          records={records}
          canEdit={canEdit}
          canDelete={canDelete}
          canStatus={canStatus}
          onEdit={(r) =>
            setModal({
              type: "form",
              record: r,
            })
          }
          onDelete={(r) =>
            setModal({
              type: "delete",
              record: r,
            })
          }
          onStatus={(r) =>
            setModal({
              type: "status",
              record: r,
            })
          }
          onDetails={(r) =>
            setModal({
              type: "details",
              record: r,
            })
          }
          onHistory={(r) =>
            setModal({
              type: "history",
              record: r,
            })
          }
        />
      )}

      <DataTablePagination
        pagination={pagination}
        loading={loading}
        onPageChange={load}
        entityLabel="records"
      />

      {/* IMPORTANT:
          SupplierFormModal expects "supplier", not "record".
          This fixes edit form pre-population.
      */}
      <SupplierFormModal
        open={modal.type === "form"}
        supplier={modal.record}
        user={user}
        saving={saving}
        onClose={() =>
          setModal({
            type: "",
            record: null,
          })
        }
        onSubmit={save}
      />

      <SupplierStatusModal
        open={modal.type === "status"}
        record={modal.record}
        organizationId={organizationId}
        saving={saving}
        onClose={() =>
          setModal({
            type: "",
            record: null,
          })
        }
        onSubmit={changeStatus}
      />

      <SupplierDetailsModal
        open={modal.type === "details"}
        record={modal.record}
        onClose={() =>
          setModal({
            type: "",
            record: null,
          })
        }
      />

      <SupplierDeleteConfirmModal
        open={modal.type === "delete"}
        record={modal.record}
        loading={saving}
        onClose={() =>
          setModal({
            type: "",
            record: null,
          })
        }
        onConfirm={remove}
      />

      <SupplierAuditLog
        open={modal.type === "history"}
        record={modal.record}
        supplier={modal.record}
        onClose={() =>
          setModal({
            type: "",
            record: null,
          })
        }
      />
    </div>
  );
}
