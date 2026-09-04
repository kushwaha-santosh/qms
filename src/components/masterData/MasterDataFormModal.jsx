"use client";

import { useEffect, useState } from "react";

/* ==========================================================
 * MASTER DATA TYPES
 *
 * Reusable QMS master-data types.
 *
 * QMS_SOURCE
 * QMS_SEVERITY
 * QMS_CATEGORY
 * QMS_STATUS
 * ROOT_CAUSE_CATEGORY
 * AUDIT_TYPE
 * SUPPLIER_TYPE
 * DOCUMENT_TYPE
 * TRAINING_TYPE
 * DEPARTMENT
 * PROCESS
 * UOM
 *
 * Product Master supporting masters:
 * PRODUCT_CATEGORY
 * BRAND
 * PRODUCT_TYPE
 * ========================================================== */

const MASTER_DATA_TYPES = [
  {
    value: "QMS_SOURCE",
    label: "Sources",
  },
  {
    value: "QMS_SEVERITY",
    label: "Severity",
  },
  {
    value: "QMS_CATEGORY",
    label: "Categories",
  },
  {
    value: "QMS_STATUS",
    label: "Statuses",
  },
  {
    value: "ROOT_CAUSE_CATEGORY",
    label: "Root Cause Categories",
  },
  {
    value: "AUDIT_TYPE",
    label: "Audit Types",
  },
  {
    value: "SUPPLIER_TYPE",
    label: "Supplier Types",
  },
  {
    value: "DOCUMENT_TYPE",
    label: "Document Types",
  },
  {
    value: "TRAINING_TYPE",
    label: "Training Types",
  },
  {
    value: "DEPARTMENT",
    label: "Departments",
  },
  {
    value: "PROCESS",
    label: "Processes",
  },
  {
    value: "UOM",
    label: "Units of Measure",
  },

  // ========================================================
  // PRODUCT MASTER SUPPORTING MASTERS
  // ========================================================

  {
    value: "PRODUCT_CATEGORY",
    label: "Product Categories",
  },
  {
    value: "BRAND",
    label: "Brands",
  },
  {
    value: "PRODUCT_TYPE",
    label: "Product Types",
  },
  {
    value: "SUPPLIER",
    label: "Supplier",
  },
];

const DEFAULT_MASTER_TYPE = "QMS_CATEGORY";

const EMPTY_FORM = {
  type: DEFAULT_MASTER_TYPE,
  code: "",
  name: "",
  description: "",
  organizationId: "",
  isSystem: false,
  isActive: true,
  sortOrder: 0,
  metadata: {},
};

export default function MasterDataFormModal({
  open,
  item,
  type = DEFAULT_MASTER_TYPE,
  organizationId = "",
  organizations = [],
  isSuperAdmin = false,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");

  /* ========================================================
   * LOAD FORM
   * ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * When editing an existing record, preserve its actual type.
     *
     * For new records, use the supplied type or the default
     * reusable QMS_CATEGORY type.
     */
    setForm({
      ...EMPTY_FORM,

      type: item?.type || type || DEFAULT_MASTER_TYPE,

      code: item?.code || "",

      name: item?.name || "",

      description: item?.description || "",

      organizationId:
        item?.organizationId?._id ||
        item?.organizationId ||
        organizationId ||
        "",

      isSystem: Boolean(item?.isSystem),

      isActive: item?.isActive !== false,

      sortOrder: item?.sortOrder ?? 0,

      metadata: item?.metadata || {},
    });

    setError("");
  }, [open, item, type, organizationId]);

  if (!open) {
    return null;
  }

  const editingSystem = Boolean(item?.isSystem);

  const isEditing = Boolean(item);

  /* ========================================================
   * FIELD HELPERS
   * ======================================================== */

  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* ========================================================
   * SUBMIT
   * ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.type) {
      setError("Master Type is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Code is required.");
      return;
    }

    /*
     * Super Admin organization master data
     * must have an organization unless system data.
     */
    if (isSuperAdmin && !form.isSystem && !form.organizationId) {
      setError("Please select an organization or enable System master data.");

      return;
    }

    try {
      await onSubmit({
        type: form.type,

        code: form.code.trim().toUpperCase(),

        name: form.name.trim(),

        description: form.description.trim(),

        organizationId: form.isSystem ? null : form.organizationId || null,

        isSystem: Boolean(isSuperAdmin && form.isSystem),

        isActive: Boolean(form.isActive),

        sortOrder: Number(form.sortOrder) || 0,

        metadata: form.metadata || {},
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save master data.",
      );
    }
  };

  /* ========================================================
   * UI
   * ======================================================== */

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* ==================================================
         * HEADER
         * ================================================== */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? "Edit Master Data" : "Add Master Data"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Configure the master data item and its scope.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* ==================================================
         * FORM
         * ================================================== */}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* ==================================================
           * ERROR
           * ================================================== */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ==================================================
           * TYPE + CODE
           * ================================================== */}

          <div className="grid gap-4 md:grid-cols-2">
            {/* MASTER TYPE */}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Master Type
              </span>

              <select
                value={form.type}
                disabled={isEditing}
                onChange={(event) => setField("type", event.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
              >
                {MASTER_DATA_TYPES.map((masterType) => (
                  <option key={masterType.value} value={masterType.value}>
                    {masterType.label}
                  </option>
                ))}
              </select>

              {isEditing && (
                <p className="mt-1 text-xs text-slate-400">
                  Master Type cannot be changed after creation.
                </p>
              )}
            </label>

            {/* CODE */}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Code
              </span>

              <input
                value={form.code}
                onChange={(event) => setField("code", event.target.value)}
                disabled={editingSystem}
                className="w-full rounded-lg border px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="EQUIPMENT_FAILURE"
              />

              <p className="mt-1 text-xs text-slate-400">
                Code is automatically normalized to uppercase.
              </p>
            </label>
          </div>

          {/* ==================================================
           * NAME
           * ================================================== */}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </span>

            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              placeholder="Equipment Failure"
            />
          </label>

          {/* ==================================================
           * DESCRIPTION
           * ================================================== */}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </span>

            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              placeholder="Optional description..."
            />
          </label>

          {/* ==================================================
           * SUPER ADMIN SCOPE
           * ================================================== */}

          {isSuperAdmin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Data Scope
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Decide whether this master data belongs to a specific
                  organization or is available system-wide.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* ORGANIZATION */}

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Organization
                  </span>

                  <select
                    value={form.organizationId}
                    disabled={form.isSystem}
                    onChange={(event) =>
                      setField("organizationId", event.target.value)
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">Select Organization</option>

                    {organizations.map((organization) => (
                      <option key={organization._id} value={organization._id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* SYSTEM */}

                <label className="flex items-center gap-3 pt-7 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isSystem}
                    onChange={(event) =>
                      setField("isSystem", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="font-medium">System master data</span>

                    <span className="block text-xs text-slate-400">
                      Available to all organizations
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ==================================================
           * ORGANIZATION USER INFO
           * ================================================== */}

          {!isSuperAdmin && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700">
                This master data will be created for your current organization.
              </p>
            </div>
          )}

          {/* ==================================================
           * SORT + ACTIVE
           * ================================================== */}

          <div className="grid gap-4 md:grid-cols-2">
            {/* SORT ORDER */}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Sort Order
              </span>

              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => setField("sortOrder", event.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              />

              <p className="mt-1 text-xs text-slate-400">
                Lower numbers appear first.
              </p>
            </label>

            {/* ACTIVE */}

            <label className="flex items-center gap-3 pt-7 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setField("isActive", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />

              <span>
                <span className="font-medium">Active</span>

                <span className="block text-xs text-slate-400">
                  Inactive items can be hidden from operational dropdowns.
                </span>
              </span>
            </label>
          </div>

          {/* ==================================================
           * FOOTER
           * ================================================== */}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
