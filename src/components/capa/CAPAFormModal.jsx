"use client";

import { useEffect, useState } from "react";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import QMSLocationCascade from "@/components/qms/QMSLocationCascade";
import { getQMSReferenceOptions } from "@/lib/api/qmsReference.api";

const EMPTY_FORM = {
  title: "",
  description: "",
  source: "",
  category: "",
  severity: "MEDIUM",
  status: "OPEN",
  dueDate: "",
  assignedTo: "",
  immediateAction: "",
  rootCause: "",
  correctiveAction: "",
  preventiveAction: "",
  organizationId: "",
  department: "",
  process: "",
  product: "",
  location: "",
  rootCauseCategory: "",
};


const getUserName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.name || user?.fullName || user?.email || "Unnamed User";
};

const getUserLabel = (user) => {
  const name = getUserName(user);
  const role = user?.role
    ? String(user.role)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "";
  return role ? `${name} (${role})` : name;
};

const getOrganizationId = (organization) =>
  String(
    organization?._id || organization?.id || organization?.organizationId || "",
  );

const getOrganizationName = (organization) =>
  organization?.name ||
  organization?.displayName ||
  organization?.organizationName ||
  organization?.email ||
  "Unnamed Organization";

export default function CAPAFormModal({
  open,
  capa = null,
  users = [],
  organizations = [],
  isSuperAdmin = false,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const userList = Array.isArray(users)
    ? users
    : Array.isArray(users?.users)
      ? users.users
      : Array.isArray(users?.data)
        ? users.data
        : Array.isArray(users?.data?.users)
          ? users.data.users
          : [];

  const organizationList = Array.isArray(organizations)
    ? organizations
    : Array.isArray(organizations?.organizations)
      ? organizations.organizations
      : Array.isArray(organizations?.data)
        ? organizations.data
        : Array.isArray(organizations?.data?.organizations)
          ? organizations.data.organizations
          : [];

  useEffect(() => {
    if (!open) return;

    const capaOrganizationId =
      capa?.organizationId?._id || capa?.organizationId || "";

    if (capa) {
      setForm({
        organizationId: String(capaOrganizationId),
        title: capa.title || "",
        description: capa.description || "",
        source: capa.source || "",
        category: capa.category || "",
        severity: capa.severity || "MEDIUM",
        status: capa.status || "OPEN",
        dueDate: capa.dueDate ? String(capa.dueDate).slice(0, 10) : "",
        assignedTo: capa.assignedTo?._id || capa.assignedTo || "",
        immediateAction: capa.immediateAction || "",
        rootCause: capa.rootCause || "",
        correctiveAction: capa.correctiveAction || "",
        preventiveAction: capa.preventiveAction || "",
        department: capa.department || "",
        process: capa.process || "",
        product: capa.product || "",
        location: capa.location || "",
        rootCauseCategory: capa.rootCauseCategory || "",
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setError("");
  }, [open, capa]);

  useEffect(() => {
    if (!open || !form.organizationId || capa?.severity) return;
    let cancelled = false;
    (async () => {
      try {
        const options = await getQMSReferenceOptions("QMS_SEVERITY", { organizationId: form.organizationId, module: "CAPA" });
        if (!cancelled && options.length) {
          const preferred = options.find((item) => String(item.code || item.name).toUpperCase() === "MEDIUM") || options[0];
          setForm((current) => ({ ...current, severity: preferred?.code || preferred?.name || "" }));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [open, form.organizationId, capa]);

  useEffect(() => {
    if (!open || !form.organizationId) return;
    if (form.status && capa) return;
    let cancelled = false;
    (async () => {
      try {
        const options = await getQMSReferenceOptions("QMS_STATUS", { organizationId: form.organizationId, module: "CAPA" });
        if (!cancelled && options.length) {
          const preferred = options.find((item) => String(item.code || item.name).toUpperCase() === "OPEN") || options[0];
          setForm((current) => ({ ...current, status: preferred?.code || preferred?.name || "" }));
        }
      } catch {
        // Backend performs the authoritative validation.
      }
    })();
    return () => { cancelled = true; };
  }, [open, form.organizationId, capa]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isSuperAdmin && !form.organizationId) {
      setError("Organization is required for SUPER_ADMIN.");
      return;
    }

    try {
      const payload = { ...form };
      if (!isSuperAdmin && !payload.organizationId)
        delete payload.organizationId;
      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save CAPA.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {capa ? "Edit CAPA" : "Create CAPA"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {capa
                ? "Update CAPA information."
                : "Create a new corrective and preventive action."}
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

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Organization <span className="text-red-500">*</span>
              </label>
              {capa ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {getOrganizationName(
                    organizationList.find(
                      (organization) =>
                        getOrganizationId(organization) ===
                        String(form.organizationId),
                    ),
                  ) || "Organization"}
                </div>
              ) : (
                <select
                  name="organizationId"
                  value={form.organizationId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select organization</option>
                  {organizationList.map((organization) => {
                    const id = getOrganizationId(organization);
                    if (!id) return null;
                    return (
                      <option key={id} value={id}>
                        {getOrganizationName(organization)}
                      </option>
                    );
                  })}
                </select>
              )}
              {organizationList.length === 0 && !capa && (
                <p className="mt-1 text-xs text-amber-600">
                  No organizations available.
                </p>
              )}
              {capa && (
                <p className="mt-1 text-xs text-slate-500">
                  Organization cannot be changed while editing a CAPA.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <QMSReferenceSelect
                name="source"
              sourceType="QMS_SOURCE"
              module="CAPA"
              label="Source"
              value={form.source}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select source"
            />
            <QMSReferenceSelect
                name="category"
              sourceType="QMS_CATEGORY"
                module="CAPA"
              label="Category"
              value={form.category}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select category"
            />
            <QMSReferenceSelect
                name="severity"
              sourceType="QMS_SEVERITY"
                module="CAPA"
              label="Severity"
              value={form.severity}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select severity"
            />
            <QMSReferenceSelect
                name="department"
              sourceType="DEPARTMENT"
                module="CAPA"
              label="Department"
              value={form.department}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select department"
            />
            <QMSReferenceSelect
                name="process"
              sourceType="PROCESS"
                module="CAPA"
              label="Process"
              value={form.process}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select process"
            />
            <QMSReferenceSelect
                name="product"
              sourceType="PRODUCT"
              label="Product"
              value={form.product}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select product"
            />
            <QMSLocationCascade
                className="md:col-span-3"
                name="location"
                label="Location"
                value={form.location}
                onChange={handleChange}
                organizationId={form.organizationId}
                disabled={loading}
                required={false}
              />
            <QMSReferenceSelect
                name="status"
              sourceType="QMS_STATUS"
                module="CAPA"
              label="Status"
              value={form.status}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select status"
            />
            <QMSReferenceSelect
                name="rootCauseCategory"
              sourceType="ROOT_CAUSE_CATEGORY"
                module="CAPA"
              label="Root Cause Category"
              value={form.rootCauseCategory}
              onChange={handleChange}
              organizationId={form.organizationId}
              disabled={loading}
              placeholder="Select root cause category"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Assigned To
              </label>
              <select
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select user</option>
                {userList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {getUserLabel(user)}
                  </option>
                ))}
              </select>
              {userList.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No active users available.
                </p>
              )}
            </div>
          </div>

          {[
            ["immediateAction", "Immediate Action"],
            ["rootCause", "Root Cause"],
            ["correctiveAction", "Corrective Action"],
            ["preventiveAction", "Preventive Action"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {label}
              </label>
              <textarea
                name={name}
                value={form[name]}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : capa ? "Update CAPA" : "Create CAPA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
