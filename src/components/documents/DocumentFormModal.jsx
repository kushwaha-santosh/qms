"use client";

import { useEffect, useMemo, useState } from "react";
import { getUsers } from "@/lib/api/users.api";
import { getOrganizations } from "@/lib/api/organization.api";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

const EMPTY = {
  organizationId: "",
  documentNumber: "",
  title: "",
  documentType: "",
  category: "",
  department: "",
  revision: "0",
  description: "",
  status: "OPEN",
  statusComment: "",
  owner: "",
  effectiveDate: "",
  reviewDate: "",
  expiryDate: "",
  fileSource: "URL",
  fileName: "",
  fileUrl: "",
  file: null,
  fileSize: 0,
  mimeType: "",
  tags: "",
};

const idOf = (v) => String(v?._id || v?.id || v || "");
const dateValue = (v) => (v ? String(v).slice(0, 10) : "");
const unwrapList = (r, keys = []) => {
  const d = r?.data?.data ?? r?.data ?? r;
  if (Array.isArray(d)) return d;
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
  return [];
};

export default function DocumentFormModal({
  open,
  document,
  user,
  onClose,
  onSubmit,
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState("");

  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const editing = Boolean(document?._id || document?.id);

  useEffect(() => {
    if (!open) return;
    const org =
      idOf(document?.organizationId) ||
      (isSuperAdmin ? "" : idOf(user?.organizationId));
    setForm({
      ...EMPTY,
      organizationId: org,
      documentNumber: document?.documentNumber || "",
      title: document?.title || "",
      documentType: document?.documentType || "",
      category: document?.category || "",
      department: document?.department || "",
      revision: document?.revision || "0",
      description: document?.description || "",
      status: document?.status || "OPEN",
      statusComment: document?.statusComment || "",
      owner: idOf(document?.owner),
      effectiveDate: dateValue(document?.effectiveDate),
      reviewDate: dateValue(document?.reviewDate),
      expiryDate: dateValue(document?.expiryDate),
      fileSource: document?.fileSource || (document?.fileUrl ? "URL" : "UPLOAD"),
      fileName: document?.fileName || "",
      fileUrl: document?.fileUrl || "",
      file: null,
      fileSize: document?.fileSize || 0,
      mimeType: document?.mimeType || "",
      tags: Array.isArray(document?.tags)
        ? document.tags.join(", ")
        : document?.tags || "",
    });
    setError("");
  }, [open, document, user, isSuperAdmin]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.allSettled([
      getUsers({ page: 1, limit: 100, status: "ACTIVE" }),
      isSuperAdmin
        ? getOrganizations({ page: 1, limit: 100, status: "ACTIVE" })
        : Promise.resolve([]),
    ]).then(([u, o]) => {
      if (cancelled) return;
      if (u.status === "fulfilled")
        setUsers(unwrapList(u.value, ["users", "records"]));
      if (o.status === "fulfilled")
        setOrganizations(unwrapList(o.value, ["organizations", "records"]));
    });
    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin]);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const selectedOrganizationId = useMemo(
    () =>
      form.organizationId || (isSuperAdmin ? "" : idOf(user?.organizationId)),
    [form.organizationId, isSuperAdmin, user],
  );

  const selectSource = (value) => {
    setForm((previous) => ({
      ...previous,
      fileSource: value,
      file: null,
      ...(value === "UPLOAD" ? { fileUrl: "" } : { fileName: "", fileStorageKey: "", fileAbsolutePath: "" }),
    }));
    setError("");
  };

  const selectFile = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((previous) => ({
      ...previous,
      file,
      fileSource: "UPLOAD",
      fileName: file?.name || "",
      fileSize: file?.size || 0,
      mimeType: file?.type || "",
      fileUrl: "",
    }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.documentNumber.trim())
      return setError("Document number is required.");
    if (!form.title.trim()) return setError("Document title is required.");
    if (!form.documentType) return setError("Document type is required.");
    if (isSuperAdmin && !selectedOrganizationId)
      return setError("Organization is required.");
    try {
      const payload = {
        ...form,
        organizationId: selectedOrganizationId,
        tags: form.tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      if (form.fileSource === "UPLOAD") {
        if (!form.file && !document?.fileStorageKey) {
          return setError("Please select a document file to upload.");
        }
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === "file" || value === null || value === undefined) return;
          if (key === "tags") formData.append(key, JSON.stringify(value));
          else formData.append(key, String(value));
        });
        if (form.file) formData.append("file", form.file);
        await onSubmit(formData);
      } else {
        await onSubmit({ ...payload, fileSource: "URL", file: undefined });
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to save document.",
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit Document" : "Create Document"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {isSuperAdmin && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Organization *
                </span>
                <select
                  name="organizationId"
                  value={form.organizationId}
                  onChange={change}
                  disabled={editing || saving}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">Select organization</option>
                  {organizations.map((item) => (
                    <option key={idOf(item)} value={idOf(item)}>
                      {item.name || item.organizationName || item.code}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Document Number *
              </span>
              <input
                name="documentNumber"
                value={form.documentNumber}
                onChange={change}
                disabled={editing || saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Title *
              </span>
              <input
                name="title"
                value={form.title}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
            <QMSReferenceSelect
              sourceType="DOCUMENT_TYPE"
              name="documentType"
              label="Document Type"
              module="DOCUMENT"
              value={form.documentType}
              onChange={change}
              organizationId={selectedOrganizationId}
              required
              disabled={saving}
            />
            <QMSReferenceSelect
              sourceType="DEPARTMENT"
              name="department"
              label="Department"
              module="DOCUMENT"
              value={form.department}
              onChange={change}
              organizationId={selectedOrganizationId}
              disabled={saving}
            />
            <QMSReferenceSelect
              sourceType="QMS_CATEGORY"
              name="category"
              label="Category"
              module="DOCUMENT"
              value={form.category}
              onChange={change}
              organizationId={selectedOrganizationId}
              disabled={saving}
            />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Revision
              </span>
              <input
                name="revision"
                value={form.revision}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Owner
              </span>
              <select
                name="owner"
                value={form.owner}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              >
                <option value="">Select owner</option>
                {users.map((u) => (
                  <option key={idOf(u)} value={idOf(u)}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                      u.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Effective Date
              </span>
              <input
                type="date"
                name="effectiveDate"
                value={form.effectiveDate}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Review Date
              </span>
              <input
                type="date"
                name="reviewDate"
                value={form.reviewDate}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Expiry Date
              </span>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={change}
                disabled={saving}
                className="w-full rounded-xl border px-3 py-2.5"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Description
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              disabled={saving}
              rows={4}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-800">Document Source</div>
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="fileSource"
                  value="UPLOAD"
                  checked={form.fileSource === "UPLOAD"}
                  onChange={(e) => selectSource(e.target.value)}
                  disabled={saving}
                />
                Upload Document
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="fileSource"
                  value="URL"
                  checked={form.fileSource === "URL"}
                  onChange={(e) => selectSource(e.target.value)}
                  disabled={saving}
                />
                Document URL
              </label>
            </div>

            {form.fileSource === "UPLOAD" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Select local document *</span>
                <input
                  type="file"
                  onChange={selectFile}
                  disabled={saving}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp"
                  className="w-full rounded-xl border bg-white px-3 py-2.5"
                />
                {form.fileName && (
                  <div className="mt-2 text-xs text-slate-500">Selected: {form.fileName}</div>
                )}
                {editing && document?.fileStorageKey && !form.file && (
                  <div className="mt-1 text-xs text-slate-500">Existing uploaded file will be retained unless you select a replacement.</div>
                )}
              </label>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">File Name</span>
                  <input
                    name="fileName"
                    value={form.fileName}
                    onChange={change}
                    disabled={saving}
                    className="w-full rounded-xl border bg-white px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Document URL *</span>
                  <input
                    name="fileUrl"
                    value={form.fileUrl}
                    onChange={change}
                    disabled={saving}
                    type="url"
                    className="w-full rounded-xl border bg-white px-3 py-2.5"
                    placeholder="https://example.com/document.pdf"
                  />
                </label>
              </div>
            )}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tags</span>
            <input
              name="tags"
              value={form.tags}
              onChange={change}
              disabled={saving}
              className="w-full rounded-xl border px-3 py-2.5"
              placeholder="quality, procedure, iso"
            />
          </label>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Document"
                  : "Create Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
