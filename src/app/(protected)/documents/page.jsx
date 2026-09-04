"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
  updateDocumentStatus,
  getDocumentViewUrl,
} from "@/lib/api/documents.api";
import DocumentTable from "@/components/documents/DocumentTable";
import DocumentFormModal from "@/components/documents/DocumentFormModal";
import DocumentDetailsModal from "@/components/documents/DocumentDetailsModal";
import DocumentStatusModal from "@/components/documents/DocumentStatusModal";
import DocumentDeleteConfirmModal from "@/components/documents/DocumentDeleteConfirmModal";
import DocumentAuditLog from "@/components/documents/DocumentAuditLog";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

export default function DocumentsPage() {
  const { user, hasPermission, hasRole } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    documentType: "",
    department: "",
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
  const [form, setForm] = useState({ open: false, document: null });
  const [details, setDetails] = useState({ open: false, document: null });
  const [status, setStatus] = useState({ open: false, document: null });
  const [del, setDel] = useState({ open: false, document: null });
  const [history, setHistory] = useState({ open: false, document: null });

  const isSuperAdmin =
    String(user?.role || "").toUpperCase() === "SUPER_ADMIN" ||
    hasRole?.("SUPER_ADMIN");
  const canCreate = Boolean(
    hasPermission?.("DOCUMENT_CREATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canEdit = Boolean(
    hasPermission?.("DOCUMENT_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canDelete = Boolean(
    hasPermission?.("DOCUMENT_DELETE") || hasRole?.("ORG_ADMIN"),
  );
  const canStatus = Boolean(
    hasPermission?.("DOCUMENT_STATUS_UPDATE") ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );
  const canView = Boolean(
    hasPermission?.("DOCUMENT_VIEW") ||
    isSuperAdmin ||
    hasRole?.("ORG_ADMIN") ||
    hasRole?.("QUALITY_MANAGER"),
  );

  const load = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError("");
      try {
        const response = await getDocuments({
          ...filters,
          page,
          limit: pagination.limit,
        });
        const data = response?.data || response || {};
        setDocuments(data?.documents || data?.records || []);
        if (data?.pagination) setPagination(data.pagination);
      } catch (e) {
        setDocuments([]);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to load documents.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.limit],
  );

  useEffect(() => {
    if (!message && !error) return;

    const timer = setTimeout(() => {
      if (message) setMessage("");
      if (error) setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    load(1);
  }, [
    filters.search,
    filters.status,
    filters.documentType,
    filters.department,
  ]);
  useEffect(() => {
    if (canView) load(pagination.page);
  }, [canView]);

  const organizationId = useMemo(
    () => String(user?.organizationId?._id || user?.organizationId || ""),
    [user],
  );

  const save = async (data) => {
    setSaving(true);
    setError("");
    try {
      if (form.document?._id) await updateDocument(form.document._id, data);
      else await createDocument(data);
      setForm({ open: false, document: null });
      setMessage("Document saved successfully.");
      await load(pagination.page);
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!del.document?._id) return;
    setSaving(true);
    setError("");
    try {
      await deleteDocument(del.document._id);
      setDel({ open: false, document: null });
      setMessage("Document deleted successfully.");
      await load(pagination.page);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to delete document.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (data) => {
    if (!status.document?._id) return;
    setSaving(true);
    setError("");
    try {
      await updateDocumentStatus(status.document._id, data);
      setStatus({ open: false, document: null });
      setMessage("Document status updated successfully.");
      await load(pagination.page);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to update status.",
      );
    } finally {
      setSaving(false);
    }
  };

  // const viewDocument = async (document) => {
  //   try {
  //     setError("");
  //     const url = await getDocumentViewUrl(document?._id);
  //     window.open(url, "_blank", "noopener,noreferrer");
  //   } catch (e) {
  //     setError(
  //       e?.response?.data?.message || e?.message || "Unable to open document.",
  //     );
  //   }
  // };

  const viewDocument = (document) => {
    if (!document) {
      return;
    }

    const fileSource = String(document.fileSource || "").toUpperCase();

    if (fileSource === "URL") {
      const url = String(document.fileUrl || "").trim();

      if (!url) {
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");

      return;
    }

    if (fileSource === "UPLOAD") {
      window.open(
        `/api/documents/${document._id}/view`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const changeFilter = (e) =>
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            Controlled QMS documents and revisions.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setForm({ open: true, document: null })}
            className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white"
          >
            + New Document
          </button>
        )}
      </div>
      {message && (
        <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-4 text-lg font-semibold leading-none text-green-600 hover:text-green-800"
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 text-lg font-semibold leading-none text-red-600 hover:text-red-800"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <input
          name="search"
          value={filters.search}
          onChange={changeFilter}
          placeholder="Search document..."
          className="rounded-xl border px-3 py-2.5 text-sm"
        />
        <QMSReferenceSelect
          sourceType="QMS_STATUS"
          name="status"
          label=""
          module="DOCUMENT"
          value={filters.status}
          onChange={changeFilter}
          organizationId={organizationId}
          placeholder="All statuses"
        />
        <QMSReferenceSelect
          sourceType="DOCUMENT_TYPE"
          name="documentType"
          label=""
          module="DOCUMENT"
          value={filters.documentType}
          onChange={changeFilter}
          organizationId={organizationId}
          placeholder="All document types"
        />
        <QMSReferenceSelect
          sourceType="DEPARTMENT"
          name="department"
          label=""
          module="DOCUMENT"
          value={filters.department}
          onChange={changeFilter}
          organizationId={organizationId}
          placeholder="All departments"
        />
      </div>
      {loading ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
          Loading documents...
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          canEdit={canEdit}
          canDelete={canDelete}
          canStatus={canStatus}
          onEdit={(d) => setForm({ open: true, document: d })}
          onDelete={(d) => setDel({ open: true, document: d })}
          onStatus={(d) => setStatus({ open: true, document: d })}
          onDetails={(d) => setDetails({ open: true, document: d })}
          onViewDocument={viewDocument}
          onHistory={(d) => setHistory({ open: true, document: d })}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
        <span>{pagination.total || 0} document(s)</span>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1 || loading}
            onClick={() => load(pagination.page - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 py-1.5">
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
      <DocumentFormModal
        open={form.open}
        document={form.document}
        user={user}
        saving={saving}
        onClose={() => setForm({ open: false, document: null })}
        onSubmit={save}
      />
      <DocumentDetailsModal
        open={details.open}
        document={details.document}
        onClose={() => setDetails({ open: false, document: null })}
        onViewDocument={viewDocument}
      />
      <DocumentStatusModal
        open={status.open}
        document={status.document}
        organizationId={organizationId}
        saving={saving}
        onClose={() => setStatus({ open: false, document: null })}
        onSubmit={changeStatus}
      />
      <DocumentDeleteConfirmModal
        open={del.open}
        document={del.document}
        loading={saving}
        onClose={() => setDel({ open: false, document: null })}
        onConfirm={remove}
      />
      <DocumentAuditLog
        open={history.open}
        document={history.document}
        onClose={() => setHistory({ open: false, document: null })}
      />
    </div>
  );
}
