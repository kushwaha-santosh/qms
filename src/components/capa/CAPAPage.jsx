"use client";

import { DataTablePagination } from "@/components/common/data-table";
import { useCallback, useEffect, useState } from "react";
import {
  getCAPAs,
  createCAPA,
  updateCAPA,
  updateCAPAStatus,
  assignCAPA,
  deleteCAPA,
} from "@/lib/api/capa.api.js";
import { getUsers } from "@/lib/api/users.api.js";
import { useAuth } from "@/context/AuthProvider.jsx";
import CAPATable from "./CAPATable";
import CAPAFilters from "./CAPAFilters";
import CAPAFormModal from "./CAPAFormModal";
import CAPADetailsModal from "./CAPADetailsModal";
import CAPAAuditLog from "./CAPAAuditLog";
import CAPAStatusConfirmModal from "./CAPAStatusConfirmModal";
import CAPAAssignModal from "./CAPAAssignModal";
import CAPADeleteConfirmModal from "./CAPADeleteConfirmModal";

const INITIAL_FILTERS = {
  search: "",
  status: "",
  severity: "",
  category: "",
  source: "",
  department: "",
  process: "",
  organizationId: "",
};
const EMPTY_PAGINATION = { total: 0, page: 1, limit: 20, totalPages: 1 };

const normalizeList = (response, keys = []) => {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    const value = key.split(".").reduce((obj, part) => obj?.[part], response);
    if (Array.isArray(value)) return value;
  }
  return [];
};

export default function CAPAPage() {
  const { user, hasPermission } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [capas, setCapas] = useState([]);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const canView = isSuperAdmin || hasPermission?.("CAPA_VIEW");
  const canCreate = isSuperAdmin || hasPermission?.("CAPA_CREATE");
  const canUpdate = isSuperAdmin || hasPermission?.("CAPA_UPDATE");
  const canDelete = isSuperAdmin || hasPermission?.("CAPA_DELETE");
  const canStatus = isSuperAdmin || hasPermission?.("CAPA_STATUS_UPDATE");

  const loadOrganizations = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await fetch("/api/capa/organizations", {
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.message || "Unable to load organizations.");
      setOrganizations(
        normalizeList(json, ["data", "data.organizations", "organizations"]),
      );
    } catch (err) {
      setOrganizations([]);
      setError(err?.message || "Unable to load organizations.");
    }
  }, [isSuperAdmin]);

  const loadCAPAs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getCAPAs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setCapas(Array.isArray(result?.capas) ? result.capas : []);
      setPagination(result?.pagination || EMPTY_PAGINATION);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unable to load CAPAs.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);
  useEffect(() => {
    loadCAPAs();
  }, [loadCAPAs]);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        const response = await getUsers({
          page: 1,
          limit: 100,
          search: "",
          role: "",
          status: "ACTIVE",
        });
        const list = normalizeList(response, ["users", "data", "data.users"]);
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setUsers([]);
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing?._id) await updateCAPA(editing._id, data);
      else await createCAPA(data);
      setFormOpen(false);
      setEditing(null);
      await loadCAPAs();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async ({ status, comments }) => {
    if (!selected?._id) throw new Error("CAPA ID is required.");
    setSaving(true);
    try {
      await updateCAPAStatus(selected._id, status, comments);
      setStatusOpen(false);
      setSelected(null);
      await loadCAPAs();
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (assignedTo) => {
    if (!selected?._id) throw new Error("CAPA ID is required.");
    setSaving(true);
    try {
      await assignCAPA(selected._id, assignedTo);
      setAssignOpen(false);
      setSelected(null);
      await loadCAPAs();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?._id) throw new Error("CAPA ID is required.");
    setSaving(true);
    try {
      await deleteCAPA(selected._id);
      setDeleteOpen(false);
      setSelected(null);
      await loadCAPAs();
    } finally {
      setSaving(false);
    }
  };

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
    <div className="space-y-5 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CAPA</h1>
          <p className="mt-1 text-sm text-slate-500">
            Corrective and Preventive Actions
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
            + Create CAPA
          </button>
        )}
      </div>

      <CAPAFilters
        filters={filters}
        onChange={changeFilter}
        onReset={resetFilters}
        organizations={organizations}
        showOrganizationFilter={isSuperAdmin}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white py-16 text-center text-sm text-slate-500">
          Loading CAPAs...
        </div>
      ) : (
        <CAPATable
          capas={capas}
          showOrganization={isSuperAdmin}
          onView={(capa) => {
            setSelected(capa);
            setDetailsOpen(true);
          }}
          onEdit={
            canUpdate
              ? (capa) => {
                  setEditing(capa);
                  setFormOpen(true);
                }
              : undefined
          }
          onStatus={
            canStatus
              ? (capa) => {
                  setSelected(capa);
                  setStatusOpen(true);
                }
              : undefined
          }
          onAssign={
            canUpdate
              ? (capa) => {
                  setSelected(capa);
                  setAssignOpen(true);
                }
              : undefined
          }
          onAudit={(capa) => {
            setSelected(capa);
            setAuditOpen(true);
          }}
          onDelete={
            canDelete
              ? (capa) => {
                  setSelected(capa);
                  setDeleteOpen(true);
                }
              : undefined
          }
        />
      )}

      <DataTablePagination
        pagination={pagination}
        loading={loading}
        onPageChange={(nextPage) =>
          setPagination((current) => ({ ...current, page: nextPage }))
        }
        entityLabel="CAPAs"
      />

      <CAPAFormModal
        open={formOpen}
        capa={editing}
        users={users}
        organizations={organizations}
        isSuperAdmin={isSuperAdmin}
        loading={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
      />
      <CAPADetailsModal
        open={detailsOpen}
        capa={selected}
        onClose={() => {
          setDetailsOpen(false);
          setSelected(null);
        }}
      />
      <CAPAStatusConfirmModal
        open={statusOpen}
        capa={selected}
        loading={saving}
        onClose={() => {
          if (!saving) {
            setStatusOpen(false);
            setSelected(null);
          }
        }}
        onConfirm={handleStatus}
      />
      <CAPAAssignModal
        open={assignOpen}
        capa={selected}
        users={users}
        loading={saving}
        onClose={() => {
          if (!saving) {
            setAssignOpen(false);
            setSelected(null);
          }
        }}
        onConfirm={handleAssign}
      />
      <CAPAAuditLog
        open={auditOpen}
        capa={selected}
        onClose={() => {
          setAuditOpen(false);
          setSelected(null);
        }}
      />
      <CAPADeleteConfirmModal
        open={deleteOpen}
        capa={selected}
        loading={saving}
        onClose={() => {
          if (!saving) {
            setDeleteOpen(false);
            setSelected(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
