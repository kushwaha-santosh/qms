"use client";

import { useEffect, useMemo, useState } from "react";

import { getUsers } from "@/lib/api/users.api";
import { getOrganizations } from "@/lib/api/organization.api";

import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import QMSLocationCascade from "@/components/qms/QMSLocationCascade";
import { useAuth } from "@/context/AuthProvider";

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

const SYSTEM_ROLE = "SUPER_ADMIN";

const valueOf = (value) => {
  if (value == null) {
    return "";
  }

  return String(value);
};

const idOf = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    return valueOf(
      value?._id || value?.id || value?.locationId || value?.productId || "",
    );
  }

  return valueOf(value);
};

/**
 * Normalize a QMS/master-data value.
 *
 * Audit reference fields normally store strings such as:
 *   AUDIT_TYPE
 *   DEPARTMENT
 *   PROCESS
 *
 * This helper also protects the edit form if the API later returns
 * a populated object instead of a plain string.
 */
const referenceValueOf = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    return valueOf(
      value?.code ||
        value?.key ||
        value?.value ||
        value?.name ||
        value?.displayName ||
        "",
    );
  }

  return valueOf(value);
};

const dateForInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getResponseItems = (response, keys = []) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }

    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  return [];
};

const getResponseObject = (response, keys = []) => {
  if (!response) {
    return null;
  }

  if (Array.isArray(response)) {
    return null;
  }

  for (const key of keys) {
    if (response?.[key] && typeof response[key] === "object") {
      return response[key];
    }

    if (response?.data?.[key] && typeof response.data[key] === "object") {
      return response.data[key];
    }
  }

  if (response?.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
};

export default function AuditFormModal({
  open,
  audit = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const { user, hasRole } = useAuth();

  const isEdit = Boolean(audit?._id);

  const isSuperAdmin =
    user?.role === SYSTEM_ROLE || hasRole?.(SYSTEM_ROLE) === true;

  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");

  const [organizationError, setOrganizationError] = useState("");

  const [organizations, setOrganizations] = useState([]);

  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  const [users, setUsers] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);

  const [statusOptions, setStatusOptions] = useState([]);

  const [loadingStatuses, setLoadingStatuses] = useState(false);

  /**
   * Organization used by QMS reference controls.
   *
   * For SUPER_ADMIN:
   *   - create => selected organization
   *   - edit   => existing audit organization
   *
   * For organization users:
   *   - authenticated user's organization
   */
  const selectedOrganizationId = useMemo(() => {
    if (isSuperAdmin) {
      return form.organizationId || idOf(audit?.organizationId) || "";
    }

    return idOf(user?.organizationId) || form.organizationId || "";
  }, [
    audit?.organizationId,
    form.organizationId,
    isSuperAdmin,
    user?.organizationId,
  ]);

  /**
   * ----------------------------------------------------------
   * RESET / INITIALIZE FORM
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * location/product/leadAuditor can be populated objects when
   * the Audit API returns an edited record.
   *
   * Always store IDs in the form.
   *
   * In particular:
   *
   *   valueOf(audit.location)
   *
   * would produce:
   *
   *   "[object Object]"
   *
   * which breaks QMSLocationCascade.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (!audit) {
      setForm({
        ...EMPTY_FORM,
        organizationId: isSuperAdmin ? "" : idOf(user?.organizationId),
      });

      setError("");
      setOrganizationError("");

      return;
    }

    setForm({
      organizationId: idOf(audit.organizationId),

      title: valueOf(audit.title),

      auditType: referenceValueOf(audit.auditType),

      scope: valueOf(audit.scope),

      criteria: valueOf(audit.criteria),

      description: valueOf(audit.description),

      auditDate: dateForInput(audit.auditDate),

      dueDate: dateForInput(audit.dueDate),

      leadAuditor: idOf(audit.leadAuditor),

      auditors: Array.isArray(audit.auditors)
        ? audit.auditors.map(idOf).filter(Boolean)
        : [],

      department: referenceValueOf(audit.department),

      process: referenceValueOf(audit.process),

      /*
       * FIX:
       *
       * audit.location is populated by the backend.
       * Do NOT use valueOf() here.
       */
      location: idOf(audit.location),

      /*
       * Product is also populated by the backend.
       * Store only the product ID in form state.
       */
      product: idOf(audit.product),

      status: referenceValueOf(audit.status),

      findings: valueOf(audit.findings),
    });

    setError("");
    setOrganizationError("");
  }, [audit, isSuperAdmin, open, user?.organizationId]);

  /**
   * ----------------------------------------------------------
   * LOAD ORGANIZATIONS
   * ----------------------------------------------------------
   */
  useEffect(() => {
    if (!open || !isSuperAdmin) {
      return;
    }

    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setLoadingOrganizations(true);
        setOrganizationError("");

        const response = await getOrganizations({
          page: 1,
          limit: 100,
          status: "ACTIVE",
        });

        if (cancelled) {
          return;
        }

        const items = getResponseItems(response, ["organizations"]);

        setOrganizations(items);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "[AuditFormModal] Organization load error:",
          requestError,
        );

        setOrganizations([]);

        setOrganizationError(
          requestError?.message || "Unable to load organizations.",
        );
      } finally {
        if (!cancelled) {
          setLoadingOrganizations(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, open]);

  /**
   * ----------------------------------------------------------
   * LOAD USERS
   * ----------------------------------------------------------
   *
   * Lead Auditor and Auditor options are organization users.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const organizationId = selectedOrganizationId;

    if (!organizationId) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const response = await getUsers({
          organizationId,
          page: 1,
          limit: 100,
          status: "ACTIVE",
        });

        if (cancelled) {
          return;
        }

        const items = getResponseItems(response, ["users"]);

        setUsers(items);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error("[AuditFormModal] User load error:", requestError);

        setUsers([]);
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, selectedOrganizationId]);

  /**
   * ----------------------------------------------------------
   * LOAD AUDIT STATUS OPTIONS
   * ----------------------------------------------------------
   *
   * Status remains master-data driven.
   *
   * Normal Audit edit does NOT use this to update status.
   * Status changes continue through AuditStatusModal.
   */
  // useEffect(() => {
  //   if (!open) {
  //     return;
  //   }

  //   let cancelled = false;

  //   const loadStatuses = async () => {
  //     try {
  //       setLoadingStatuses(true);

  //       const response = await getAuditStatusOptions({
  //         organizationId: selectedOrganizationId || "",
  //       });

  //       if (cancelled) {
  //         return;
  //       }

  //       const items = getResponseItems(response, [
  //         "statuses",
  //         "options",
  //         "data",
  //       ]);

  //       setStatusOptions(items);
  //     } catch (requestError) {
  //       if (cancelled) {
  //         return;
  //       }

  //       console.error("[AuditFormModal] Status load error:", requestError);

  //       setStatusOptions([]);
  //     } finally {
  //       if (!cancelled) {
  //         setLoadingStatuses(false);
  //       }
  //     }
  //   };

  //   loadStatuses();

  //   return () => {
  //     cancelled = true;
  //   };
  // }, [open, selectedOrganizationId]);

  /**
   * ----------------------------------------------------------
   * UNIFIED CHANGE HANDLER
   * ----------------------------------------------------------
   */
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

  /**
   * ----------------------------------------------------------
   * SUBMIT
   * ----------------------------------------------------------
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setOrganizationError("");

    try {
      /**
       * SUPER_ADMIN must select an organization while creating.
       *
       * During edit, organization is read-only and is not sent
       * from this form. The backend already knows the existing
       * Audit organization.
       */
      if (isSuperAdmin && !isEdit && !form.organizationId) {
        const message = "Please select an organization.";

        setOrganizationError(message);
        setError(message);

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

        auditors: Array.isArray(form.auditors)
          ? form.auditors.filter(Boolean)
          : [],

        department: form.department,

        process: form.process,

        /*
         * Location is always an ID.
         */
        location: form.location || null,

        /*
         * Product is always an ID.
         */
        product: form.product || null,

        /*
         * Keep status in the payload for compatibility with
         * the existing form/API contract.
         *
         * The backend normal Audit update removes status before
         * saving, so status changes remain handled separately
         * through AuditStatusModal.
         */
        status: form.status,

        findings: form.findings.trim(),
      };

      /*
       * SUPER_ADMIN chooses the tenant only during creation.
       */
      if (isSuperAdmin && !isEdit) {
        payload.organizationId = form.organizationId;
      }

      await onSubmit(payload);
    } catch (requestError) {
      console.error("[AuditFormModal] Submit error:", requestError);

      const message =
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        requestError?.message ||
        "Unable to save audit.";

      setError(message);

      /*
       * Keep the modal open so the user can see and correct
       * the problem.
       */
      throw requestError;
    }
  };

  /**
   * ----------------------------------------------------------
   * CLOSE
   * ----------------------------------------------------------
   */
  const handleClose = () => {
    if (loading) {
      return;
    }

    setError("");
    setOrganizationError("");

    onClose?.();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* ====================================================
            HEADER
        ==================================================== */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Audit" : "Create Audit"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update the audit information."
                : "Create a new audit record."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ====================================================
            BODY
        ==================================================== */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-6 py-5">
            {/* =================================================
                ERRORS
            ================================================= */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="font-medium">Unable to save audit</div>

                <div className="mt-1">{error}</div>
              </div>
            )}

            {organizationError && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {organizationError}
              </div>
            )}

            {/* =================================================
                ORGANIZATION
            ================================================= */}
            {isSuperAdmin && (
              <div className="mb-6">
                <label
                  htmlFor="organizationId"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Organization{" "}
                  {!isEdit && <span className="text-red-500">*</span>}
                </label>

                {isEdit ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    {(() => {
                      const organizationId = idOf(audit?.organizationId);

                      const organization = organizations.find(
                        (item) => idOf(item) === organizationId,
                      );

                      return (
                        organization?.name ||
                        organization?.displayName ||
                        audit?.organizationId?.name ||
                        organizationId ||
                        "—"
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <select
                      id="organizationId"
                      name="organizationId"
                      value={form.organizationId}
                      onChange={change}
                      disabled={loading || loadingOrganizations}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingOrganizations
                          ? "Loading organizations..."
                          : "Select organization"}
                      </option>

                      {organizations.map((organization) => {
                        const organizationId = idOf(organization);

                        if (!organizationId) {
                          return null;
                        }

                        return (
                          <option key={organizationId} value={organizationId}>
                            {organization.name ||
                              organization.displayName ||
                              organization.email ||
                              organizationId}
                          </option>
                        );
                      })}
                    </select>

                    {organizationError && (
                      <p className="mt-1 text-xs text-red-600">
                        {organizationError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* =================================================
                BASIC INFORMATION
            ================================================= */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* TITLE */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="title"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Audit Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={change}
                    disabled={loading}
                    placeholder="Enter audit title"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {/* AUDIT TYPE */}
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

                {/* DEPARTMENT */}
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

                {/* PROCESS */}
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

                {/* PRODUCT */}
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

                {/* LOCATION */}
                <div className="md:col-span-2">
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
              </div>
            </div>

            {/* =================================================
                DATE / AUDITOR INFORMATION
            ================================================= */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Audit Planning
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* AUDIT DATE */}
                <div>
                  <label
                    htmlFor="auditDate"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Audit Date
                  </label>

                  <input
                    id="auditDate"
                    name="auditDate"
                    type="date"
                    value={form.auditDate}
                    onChange={change}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {/* DUE DATE */}
                <div>
                  <label
                    htmlFor="dueDate"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Due Date
                  </label>

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={change}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {/* LEAD AUDITOR */}
                <div>
                  <label
                    htmlFor="leadAuditor"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Lead Auditor
                  </label>

                  <select
                    id="leadAuditor"
                    name="leadAuditor"
                    value={form.leadAuditor}
                    onChange={change}
                    disabled={
                      loading || loadingUsers || !selectedOrganizationId
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingUsers
                        ? "Loading users..."
                        : !selectedOrganizationId
                          ? "Select organization first"
                          : "Select lead auditor"}
                    </option>

                    {users.map((item) => {
                      const userId = idOf(item);

                      if (!userId) {
                        return null;
                      }

                      const fullName =
                        [item?.firstName, item?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        item?.name ||
                        item?.email ||
                        userId;

                      return (
                        <option key={userId} value={userId}>
                          {fullName}
                          {item?.email ? ` (${item.email})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* AUDITORS */}
                <div>
                  <label
                    htmlFor="auditors"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Auditors
                  </label>

                  <select
                    id="auditors"
                    name="auditors"
                    multiple
                    value={form.auditors}
                    onChange={change}
                    disabled={
                      loading || loadingUsers || !selectedOrganizationId
                    }
                    className="min-h-[110px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    {users.map((item) => {
                      const userId = idOf(item);

                      if (!userId) {
                        return null;
                      }

                      const fullName =
                        [item?.firstName, item?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        item?.name ||
                        item?.email ||
                        userId;

                      return (
                        <option key={userId} value={userId}>
                          {fullName}
                          {item?.email ? ` (${item.email})` : ""}
                        </option>
                      );
                    })}
                  </select>

                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple auditors.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                SCOPE / CRITERIA
            ================================================= */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Audit Scope
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* SCOPE */}
                <div>
                  <label
                    htmlFor="scope"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Scope
                  </label>

                  <textarea
                    id="scope"
                    name="scope"
                    value={form.scope}
                    onChange={change}
                    disabled={loading}
                    rows={3}
                    placeholder="Enter audit scope"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {/* CRITERIA */}
                <div>
                  <label
                    htmlFor="criteria"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Criteria / Standard
                  </label>

                  <textarea
                    id="criteria"
                    name="criteria"
                    value={form.criteria}
                    onChange={change}
                    disabled={loading}
                    rows={3}
                    placeholder="Enter audit criteria or standard"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                DESCRIPTION / FINDINGS
            ================================================= */}
            <div className="mb-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Details
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={change}
                    disabled={loading}
                    rows={4}
                    placeholder="Enter audit description"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                {/* FINDINGS */}
                <div>
                  <label
                    htmlFor="findings"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Findings
                  </label>

                  <textarea
                    id="findings"
                    name="findings"
                    value={form.findings}
                    onChange={change}
                    disabled={loading}
                    rows={4}
                    placeholder="Enter audit findings"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                STATUS INFORMATION
            ================================================= */}
            {isEdit && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Status
                </div>

                <div className="mt-1 text-sm font-semibold text-gray-800">
                  {form.status
                    ? form.status
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (letter) => letter.toUpperCase())
                    : "—"}
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Audit status is managed separately through the status action.
                </p>
              </div>
            )}

            {!isEdit && statusOptions.length === 0 && !loadingStatuses && (
              <div className="mt-4 text-xs text-gray-500">
                Status options are managed through QMS master data.
              </div>
            )}
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update Audit" : "Create Audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
