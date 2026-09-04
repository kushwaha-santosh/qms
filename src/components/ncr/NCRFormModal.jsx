"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getOrganizations } from "@/lib/api/organization.api";
import { getUsers } from "@/lib/api/users.api";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import QMSLocationCascade from "@/components/qms/QMSLocationCascade";

const EMPTY_FORM = {
  organizationId: "",
  title: "",
  description: "",
  source: "",
  severity: "",
  category: "",
  department: "",
  process: "",
  location: "",
  product: "",
  batchNumber: "",
  supplier: "",
  detectedDate: "",
  dueDate: "",
  assignedTo: "",
  immediateAction: "",
  rootCause: "",
  correctiveAction: "",
  preventiveAction: "",
};


const valueOf = (v) => (v == null ? "" : String(v));
const idOf = (v) =>
  typeof v === "object" ? valueOf(v?._id || v?.id || "") : valueOf(v);
const dateForInput = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};
const userLabel = (u) => {
  if (!u) return "";
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.email || "Unnamed User";
};
const orgIdFromUser = (u) => idOf(u?.organizationId);
const unwrapUsers = (response) =>
  response?.data?.users || response?.users || response?.data || [];
const unwrapOrganizations = (response) =>
  response?.data?.organizations ||
  response?.organizations ||
  response?.data ||
  response ||
  [];

export default function NCRFormModal({
  open,
  ncr = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");
  const [organizationError, setOrganizationError] = useState("");

  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const isEdit = Boolean(ncr?._id);
  const selectedOrganizationId = form.organizationId || orgIdFromUser(user);

  useEffect(() => {
    if (!open || !isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await getOrganizations({ status: "ACTIVE" });
        if (!cancelled)
          setOrganizations(unwrapOrganizations(response).filter(Boolean));
      } catch (e) {
        if (!cancelled)
          setOrganizationError(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to load organizations.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin]);

  useEffect(() => {
    if (!open) return;
    if (!ncr) {
      setForm({
        ...EMPTY_FORM,
        detectedDate: new Date().toISOString().slice(0, 10),
        organizationId: isSuperAdmin ? "" : orgIdFromUser(user),
      });
      setError("");
      return;
    }
    setForm({
      organizationId: idOf(ncr.organizationId),
      title: valueOf(ncr.title),
      description: valueOf(ncr.description),
      source: valueOf(ncr.source),
      severity: valueOf(ncr.severity),
      category: valueOf(ncr.category),
      department: valueOf(ncr.department),
      process: valueOf(ncr.process),
      location: valueOf(ncr.location),
      product: valueOf(ncr.product),
      batchNumber: valueOf(ncr.batchNumber),
      supplier: valueOf(ncr.supplier),
      detectedDate: dateForInput(ncr.detectedAt || ncr.detectedDate),
      dueDate: dateForInput(ncr.dueDate),
      assignedTo: idOf(ncr.assignedTo),
      immediateAction: valueOf(ncr.immediateAction),
      rootCause: valueOf(ncr.rootCause),
      correctiveAction: valueOf(ncr.correctiveAction),
      preventiveAction: valueOf(ncr.preventiveAction),
    });
    setError("");
  }, [open, ncr, isSuperAdmin, user]);

  useEffect(() => {
    if (!open || !selectedOrganizationId) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setUsersLoading(true);
        const response = await getUsers({
          organizationId: selectedOrganizationId,
          status: "ACTIVE",
          limit: 100,
          page: 1,
        });
        if (!cancelled) setUsers(unwrapUsers(response).filter(Boolean));
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to load users for assignment.",
          );
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedOrganizationId]);

  const selectedAssignedUser = useMemo(
    () => users.find((u) => String(idOf(u)) === String(form.assignedTo)),
    [users, form.assignedTo],
  );
  const organizationName =
    ncr?.organizationId?.name ||
    ncr?.organizationId?.organizationName ||
    organizations.find((o) => String(idOf(o)) === String(form.organizationId))
      ?.name ||
    "Organization";

  if (!open) return null;

  const change = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    if (name === "organizationId") setOrganizationError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isSuperAdmin && !isEdit && !form.organizationId)
      return setError("Please select an organization.");
    if (!form.title.trim()) return setError("NCR title is required.");
    if (!form.description.trim())
      return setError("NCR description is required.");
    if (!form.source) return setError("Please select the NCR source.");
    if (!form.severity) return setError("Please select severity.");
    if (!form.category) return setError("Please select category.");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      source: form.source,
      severity: form.severity,
      category: form.category,
      department: form.department.trim(),
      process: form.process.trim(),
      location: form.location.trim(),
      product: form.product.trim(),
      batchNumber: form.batchNumber.trim(),
      supplier: form.supplier.trim(),
      dueDate: form.dueDate || null,
      assignedTo: form.assignedTo || null,
      immediateAction: form.immediateAction.trim(),
      rootCause: form.rootCause.trim(),
      correctiveAction: form.correctiveAction.trim(),
      preventiveAction: form.preventiveAction.trim(),
    };
    if (form.detectedDate) payload.detectedAt = form.detectedDate;
    if (isSuperAdmin && !isEdit) payload.organizationId = form.organizationId;
    try {
      await onSubmit(payload);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to save NCR.",
      );
    }
  };

  const longFields = [
    ["immediateAction", "Immediate Action"],
    ["rootCause", "Root Cause"],
    ["correctiveAction", "Corrective Action"],
    ["preventiveAction", "Preventive Action"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Non-Conformance" : "Create Non-Conformance"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update the NCR information."
                : "Create a new non-conformance record."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto">
          <div className="space-y-5 p-6">
            {isSuperAdmin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Organization{!isEdit && " *"}
                </label>
                {isEdit ? (
                  <div className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {organizationName}
                  </div>
                ) : (
                  <select
                    name="organizationId"
                    value={form.organizationId}
                    onChange={change}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Select organization</option>
                    {organizations.map((o) => (
                      <option key={idOf(o)} value={idOf(o)}>
                        {o.name || o.organizationName || idOf(o)}
                      </option>
                    ))}
                  </select>
                )}
                {organizationError && (
                  <p className="mt-1 text-xs text-red-600">
                    {organizationError}
                  </p>
                )}
              </div>
            )}
            <Input
              name="title"
              label="NCR Title *"
              value={form.title}
              onChange={change}
              disabled={loading}
            />
            <Text
              name="description"
              label="Description *"
              value={form.description}
              onChange={change}
              disabled={loading}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <QMSReferenceSelect
                name="source"
                sourceType="QMS_SOURCE"
                module="NCR"
                label="Source"
                value={form.source}
                onChange={change}
                organizationId={selectedOrganizationId}
                required
                disabled={loading}
                placeholder="Select source"
              />
              <QMSReferenceSelect
                name="severity"
                sourceType="QMS_SEVERITY"
                module="NCR"
                label="Severity"
                value={form.severity}
                onChange={change}
                organizationId={selectedOrganizationId}
                required
                disabled={loading}
                placeholder="Select severity"
              />
              <QMSReferenceSelect
                name="category"
                sourceType="QMS_CATEGORY"
                module="NCR"
                label="Category"
                value={form.category}
                onChange={change}
                organizationId={selectedOrganizationId}
                required
                disabled={loading}
                placeholder="Select category"
              />
              <QMSReferenceSelect
                name="department"
                sourceType="DEPARTMENT"
                module="NCR"
                label="Department"
                value={form.department}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select department"
              />
              <QMSReferenceSelect
                name="process"
                sourceType="PROCESS"
                module="NCR"
                label="Process"
                value={form.process}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select process"
              />
              <QMSReferenceSelect
                name="product"
                sourceType="PRODUCT"
                label="Product"
                value={form.product}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select product"
              />
              <QMSLocationCascade
                className="md:col-span-3"
                name="location"
                label="Location"
                value={form.location}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                required={false}
              />
              <Input
                name="batchNumber"
                label="Batch Number"
                value={form.batchNumber}
                onChange={change}
                disabled={loading}
              />
              <QMSReferenceSelect
                name="supplier"
                sourceType="SUPPLIER"
                module="NCR"
                label="Supplier"
                value={form.supplier}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select supplier"
              />
              <Input
                type="date"
                name="detectedDate"
                label="Detected Date"
                value={form.detectedDate}
                onChange={change}
                disabled={loading}
              />
              <Input
                type="date"
                name="dueDate"
                label="Due Date"
                value={form.dueDate}
                onChange={change}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Assigned To
              </label>
              <select
                name="assignedTo"
                value={form.assignedTo}
                onChange={change}
                disabled={loading || usersLoading || !selectedOrganizationId}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">
                  {usersLoading
                    ? "Loading users..."
                    : !selectedOrganizationId
                      ? "Select organization first"
                      : "Unassigned"}
                </option>
                {users.map((u) => (
                  <option key={idOf(u)} value={idOf(u)}>
                    {userLabel(u)}
                    {u.role ? ` — ${u.role}` : ""}
                  </option>
                ))}
              </select>
              {selectedAssignedUser && (
                <p className="mt-1 text-xs text-slate-500">
                  Selected: {userLabel(selectedAssignedUser)}
                </p>
              )}
            </div>
            {longFields.map(([name, label]) => (
              <Text
                key={name}
                name={name}
                label={label}
                value={form[name]}
                onChange={change}
                disabled={loading}
              />
            ))}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || usersLoading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {loading ? "Saving..." : isEdit ? "Update NCR" : "Create NCR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  name,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100"
      />
    </div>
  );
}
function Text({ name, label, value, onChange, disabled = false }) {
  return (
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        rows={3}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100"
      />
    </div>
  );
}
