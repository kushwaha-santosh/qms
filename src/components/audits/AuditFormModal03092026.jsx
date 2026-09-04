"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthProvider";
import { getOrganizations } from "@/lib/api/organization.api";
import { getUsers } from "@/lib/api/users.api";
import { getQMSReferenceOptions } from "@/lib/api/qmsReference.api";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import QMSLocationCascade from "@/components/qms/QMSLocationCascade";

const EMPTY_FORM = {
  organizationId: "",
  title: "",
  auditType: "",
  scope: "",
  criteria: "",
  description: "",
  auditDate: "",
  dueDate: "",
  leadAuditor: "",
  auditors: [],
  department: "",
  process: "",
  location: "",
  product: "",
  status: "",
  findings: "",
};

const valueOf = (value) => (value == null ? "" : String(value));

const idOf = (value) =>
  typeof value === "object"
    ? valueOf(value?._id || value?.id || "")
    : valueOf(value);

const dateForInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const userLabel = (user) => {
  if (!user) {
    return "";
  }

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return name || user.name || user.email || "Unnamed User";
};

const orgIdFromUser = (user) => idOf(user?.organizationId);

const unwrapUsers = (response) =>
  response?.data?.users || response?.users || response?.data || response || [];

const unwrapOrganizations = (response) =>
  response?.data?.organizations ||
  response?.organizations ||
  response?.data ||
  response ||
  [];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  "Unable to save audit.";

const normalizeReferenceValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

const getReferenceValue = (item) =>
  item?.code || item?.key || item?.name || item?.label || "";

const findOpenStatus = (statuses) => {
  if (!Array.isArray(statuses)) {
    return null;
  }

  return statuses.find(
    (item) => normalizeReferenceValue(getReferenceValue(item)) === "OPEN",
  );
};

export default function AuditFormModal({
  open,
  audit = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);

  const [usersLoading, setUsersLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  const [error, setError] = useState("");
  const [organizationError, setOrganizationError] = useState("");

  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const isEdit = Boolean(audit?._id);

  const selectedOrganizationId = form.organizationId || orgIdFromUser(user);

  /* ---------------------------------------------------------------------- */
  /* Load organizations for SUPER_ADMIN                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open || !isSuperAdmin) {
      return;
    }

    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setOrganizationsLoading(true);
        setOrganizationError("");

        const response = await getOrganizations({
          status: "ACTIVE",
        });

        if (!cancelled) {
          setOrganizations(unwrapOrganizations(response).filter(Boolean));
        }
      } catch (error) {
        console.error("Unable to load organizations:", error);

        if (!cancelled) {
          setOrganizations([]);
          setOrganizationError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setOrganizationsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin]);

  /* ---------------------------------------------------------------------- */
  /* Initialize form                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const initializeForm = async () => {
      /* ------------------------------------------------------------------ */
      /* CREATE                                                              */
      /* ------------------------------------------------------------------ */

      if (!audit) {
        const organizationId = isSuperAdmin ? "" : orgIdFromUser(user);

        setForm({
          ...EMPTY_FORM,
          auditDate: new Date().toISOString().slice(0, 10),
          organizationId,
          status: "",
        });

        setError("");
        setOrganizationError("");

        /*
         * Normal organization users already have an organizationId,
         * so we can load the default status immediately.
         *
         * Audit uses the common QMS_STATUS Master Data,
         * the same status source used by NCR and CAPA.
         */
        if (!organizationId) {
          return;
        }

        try {
          const statuses = await getQMSReferenceOptions("QMS_STATUS", {
            organizationId,
            module: "AUDIT",
          });

          if (cancelled) {
            return;
          }

          const openStatus = findOpenStatus(statuses);

          if (!openStatus) {
            console.warn(
              "OPEN status was not found in QMS_STATUS Master Data for AUDIT.",
            );

            return;
          }

          const openStatusValue = getReferenceValue(openStatus);

          setForm((previous) => ({
            ...previous,
            status: openStatusValue,
          }));
        } catch (error) {
          console.error(
            "Unable to load default Audit status from QMS Master Data:",
            error,
          );
        }

        return;
      }

      /* ------------------------------------------------------------------ */
      /* EDIT                                                                */
      /* ------------------------------------------------------------------ */

      setForm({
        organizationId: idOf(audit.organizationId),

        title: valueOf(audit.title),

        auditType: valueOf(audit.auditType),

        scope: valueOf(audit.scope),

        criteria: valueOf(audit.criteria),

        description: valueOf(audit.description),

        auditDate: dateForInput(audit.auditDate),

        dueDate: dateForInput(audit.dueDate),

        leadAuditor: idOf(audit.leadAuditor),

        auditors: Array.isArray(audit.auditors)
          ? audit.auditors.map(idOf).filter(Boolean)
          : [],

        department: valueOf(audit.department),

        process: valueOf(audit.process),

        location: valueOf(audit.location),

        product: idOf(audit.product),

        status: valueOf(audit.status),

        findings: valueOf(audit.findings),
      });

      setError("");
      setOrganizationError("");
    };

    initializeForm();

    return () => {
      cancelled = true;
    };
  }, [open, audit, isSuperAdmin, user]);

  /* ---------------------------------------------------------------------- */
  /* Load default OPEN status after SUPER_ADMIN selects organization       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open || !isSuperAdmin || isEdit || !form.organizationId) {
      return;
    }

    let cancelled = false;

    const loadDefaultStatus = async () => {
      try {
        const statuses = await getQMSReferenceOptions("QMS_STATUS", {
          organizationId: form.organizationId,
          module: "AUDIT",
        });

        if (cancelled) {
          return;
        }

        const openStatus = findOpenStatus(statuses);

        if (!openStatus) {
          console.warn(
            "OPEN status was not found in QMS_STATUS Master Data for AUDIT.",
          );

          return;
        }

        const openStatusValue = getReferenceValue(openStatus);

        setForm((previous) => ({
          ...previous,
          status: openStatusValue,
        }));
      } catch (error) {
        console.error(
          "Unable to load default Audit status from QMS Master Data:",
          error,
        );
      }
    };

    loadDefaultStatus();

    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin, isEdit, form.organizationId]);

  /* ---------------------------------------------------------------------- */
  /* Load users                                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open || !selectedOrganizationId) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setUsersLoading(true);

        const response = await getUsers({
          organizationId: selectedOrganizationId,
          status: "ACTIVE",
          limit: 100,
          page: 1,
        });

        if (!cancelled) {
          setUsers(unwrapUsers(response).filter(Boolean));
        }
      } catch (error) {
        if (!cancelled) {
          setUsers([]);
          setError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, selectedOrganizationId]);

  /* ---------------------------------------------------------------------- */
  /* Unified change handler                                                 */
  /* ---------------------------------------------------------------------- */

  const change = (event) => {
    const { name, value, multiple, selectedOptions } = event.target;

    const nextValue = multiple
      ? Array.from(selectedOptions || []).map((option) => option.value)
      : value;

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    setError("");

    if (name === "organizationId") {
      setOrganizationError("");
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                 */
  /* ---------------------------------------------------------------------- */

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (isSuperAdmin && !isEdit && !form.organizationId) {
      setError("Please select an organization.");
      return;
    }

    if (!form.title.trim()) {
      setError("Audit title is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),

      auditType: form.auditType,

      scope: form.scope.trim(),

      criteria: form.criteria.trim(),

      description: form.description.trim(),

      auditDate: form.auditDate || null,

      dueDate: form.dueDate || null,

      leadAuditor: form.leadAuditor || null,

      auditors: Array.isArray(form.auditors) ? form.auditors : [],

      department: form.department,

      process: form.process,

      location: form.location,

      product: form.product,

      /*
       * Status is resolved from QMS_STATUS Master Data.
       */
      status: form.status,

      findings: form.findings.trim(),
    };

    /*
     * SUPER_ADMIN creates an audit for the
     * selected organization.
     */
    if (isSuperAdmin && !isEdit) {
      payload.organizationId = form.organizationId;
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Organization name                                                      */
  /* ---------------------------------------------------------------------- */

  const organizationName =
    audit?.organizationId?.name ||
    audit?.organizationId?.organizationName ||
    organizations.find(
      (organization) =>
        String(idOf(organization)) === String(form.organizationId),
    )?.name ||
    organizations.find(
      (organization) =>
        String(idOf(organization)) === String(form.organizationId),
    )?.organizationName ||
    "Organization";

  /* ---------------------------------------------------------------------- */
  /* Modal                                                                  */
  /* ---------------------------------------------------------------------- */

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Audit" : "Create Audit"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update the audit information."
                : "Create a new audit record."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
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

        {/* Form */}
        <form onSubmit={submit} className="overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Organization */}
            {isSuperAdmin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Organization
                  {!isEdit && <span className="ml-1 text-red-500">*</span>}
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
                    disabled={loading || organizationsLoading}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${
                      organizationError ? "border-red-500" : "border-slate-300"
                    }`}
                  >
                    <option value="">
                      {organizationsLoading
                        ? "Loading organizations..."
                        : organizations.length === 0
                          ? "No organizations found"
                          : "Select organization"}
                    </option>

                    {organizations.map((organization) => (
                      <option
                        key={idOf(organization)}
                        value={idOf(organization)}
                      >
                        {organization.name ||
                          organization.organizationName ||
                          organization.displayName ||
                          idOf(organization)}
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

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Title */}
              <Input
                name="title"
                label="Audit Title *"
                value={form.title}
                onChange={change}
                disabled={loading}
              />

              {/* Audit Type */}
              <QMSReferenceSelect
                name="auditType"
                sourceType="AUDIT_TYPE"
                module="AUDIT"
                label="Audit Type"
                value={form.auditType}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select audit type"
              />

              {/* Department */}
              <QMSReferenceSelect
                name="department"
                sourceType="DEPARTMENT"
                module="AUDIT"
                label="Department"
                value={form.department}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select department"
              />

              {/* Process */}
              <QMSReferenceSelect
                name="process"
                sourceType="PROCESS"
                module="AUDIT"
                label="Process"
                value={form.process}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select process"
              />

              {/* Product */}
              <QMSReferenceSelect
                name="product"
                sourceType="PRODUCT"
                module="AUDIT"
                label="Product"
                value={form.product}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                placeholder="Select product"
              />

              {/* Audit Date */}
              <Input
                type="date"
                name="auditDate"
                label="Audit Date"
                value={form.auditDate}
                onChange={change}
                disabled={loading}
              />

              {/* Due Date */}
              <Input
                type="date"
                name="dueDate"
                label="Due Date"
                value={form.dueDate}
                onChange={change}
                disabled={loading}
              />
            </div>

            {/* Scope / Criteria */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Scope & Criteria
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="scope"
                  label="Scope"
                  value={form.scope}
                  onChange={change}
                  disabled={loading}
                />

                <Input
                  name="criteria"
                  label="Criteria"
                  value={form.criteria}
                  onChange={change}
                  disabled={loading}
                />

                <Text
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={change}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Auditors */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Auditors
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Lead Auditor */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Lead Auditor
                  </label>

                  <select
                    name="leadAuditor"
                    value={form.leadAuditor}
                    onChange={change}
                    disabled={
                      loading || usersLoading || !selectedOrganizationId
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">
                      {usersLoading
                        ? "Loading users..."
                        : !selectedOrganizationId
                          ? "Select organization first"
                          : "Select lead auditor"}
                    </option>

                    {users.map((item) => {
                      const id = idOf(item);

                      if (!id) {
                        return null;
                      }

                      return (
                        <option key={id} value={id}>
                          {userLabel(item)}
                          {item.role ? ` — ${item.role}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Auditors */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Auditors
                  </label>

                  <select
                    name="auditors"
                    multiple
                    value={form.auditors}
                    onChange={change}
                    disabled={
                      loading || usersLoading || !selectedOrganizationId
                    }
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    {users.map((item) => {
                      const id = idOf(item);

                      if (!id) {
                        return null;
                      }

                      return (
                        <option key={id} value={id}>
                          {userLabel(item)}
                          {item.role ? ` — ${item.role}` : ""}
                        </option>
                      );
                    })}
                  </select>

                  <p className="mt-1 text-xs text-slate-500">
                    Hold Ctrl/Cmd to select multiple auditors.
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Location
              </h3>

              <QMSLocationCascade
                name="location"
                label="Location"
                value={form.location}
                onChange={change}
                organizationId={selectedOrganizationId}
                disabled={loading}
                required={false}
              />
            </div>

            {/* Findings */}
            <Text
              name="findings"
              label="Findings"
              value={form.findings}
              onChange={change}
              disabled={loading}
            />

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || usersLoading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update Audit" : "Create Audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Reusable Input                                                           */
/* ------------------------------------------------------------------------ */

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
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Reusable Textarea                                                        */
/* ------------------------------------------------------------------------ */

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
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}
