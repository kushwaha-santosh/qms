"use client";

import { useEffect, useState } from "react";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import { getOrganizations } from "@/lib/api/organization.api";

const empty = {
  organizationId: "",
  supplierCode: "",
  name: "",
  supplierType: "",
  category: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  rating: "",
  status: "",
  statusComment: "",
  description: "",
  qualificationDate: "",
  nextReviewDate: "",
};

const date = (v) => (v ? String(v).slice(0, 10) : "");

const normalizeOrganizations = (response) => {
  // Direct array
  if (Array.isArray(response)) {
    return response;
  }

  // Common response shapes
  if (Array.isArray(response?.organizations)) {
    return response.organizations;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.organizations)) {
    return response.data.organizations;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  if (Array.isArray(response?.data?.result)) {
    return response.data.result;
  }

  return [];
};

export default function SupplierFormModal({
  open,
  supplier,
  user,
  saving = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(empty);
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState("");

  const superAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  /*
   * Populate/reset form when modal opens or supplier changes.
   */
  useEffect(() => {
    if (!open) return;

    setForm(
      supplier
        ? {
            ...empty,
            ...supplier,
            organizationId:
              supplier.organizationId?._id || supplier.organizationId || "",
            rating: supplier.rating ?? "",
            qualificationDate: date(supplier.qualificationDate),
            nextReviewDate: date(supplier.nextReviewDate),
          }
        : { ...empty },
    );

    setError("");
  }, [open, supplier]);

  /*
   * Load organizations for SUPER_ADMIN when creating a supplier.
   *
   * The organization API can return different response wrappers,
   * so normalizeOrganizations() converts all supported shapes
   * into a plain array before storing it in state.
   */
  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      if (!open || !superAdmin || supplier) {
        if (!open) {
          setOrgs([]);
        }
        return;
      }

      try {
        const response = await getOrganizations({
          page: 1,
          limit: 100,
        });

        if (cancelled) return;

        const organizations = normalizeOrganizations(response);

        setOrgs(organizations);
      } catch (err) {
        if (cancelled) return;

        console.error("SUPPLIER FORM - ORGANIZATION LOAD ERROR:", err);

        setOrgs([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load organizations.",
        );
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [open, superAdmin, supplier]);

  if (!open) return null;

  const change = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.supplierCode || !form.name) {
      setError("Supplier code and name are required.");
      return;
    }

    if (superAdmin && !supplier && !form.organizationId) {
      setError("Organization is required.");
      return;
    }

    try {
      await onSubmit(form);
    } catch (x) {
      setError(
        x?.response?.data?.message || x?.message || "Unable to save supplier.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="mx-auto my-6 max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">
            {supplier ? "Edit Supplier" : "New Supplier"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {superAdmin && !supplier && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">Organization *</span>

              <select
                name="organizationId"
                value={form.organizationId}
                onChange={change}
                required
                className="w-full rounded-xl border px-3 py-2.5"
              >
                <option value="">Select organization</option>

                {orgs.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </select>

              {orgs.length === 0 && (
                <span className="mt-1 block text-xs text-slate-500">
                  No organizations available.
                </span>
              )}
            </label>
          )}

          <label className="text-sm">
            <span className="mb-1 block font-medium">Supplier Code *</span>

            <input
              name="supplierCode"
              value={form.supplierCode}
              onChange={change}
              required
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Supplier Name *</span>

            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <QMSReferenceSelect
            sourceType="SUPPLIER_TYPE"
            name="supplierType"
            label="Supplier Type"
            module="SUPPLIER"
            value={form.supplierType}
            onChange={change}
            organizationId={form.organizationId}
          />

          <QMSReferenceSelect
            sourceType="QMS_CATEGORY"
            name="category"
            label="Category"
            module="SUPPLIER"
            value={form.category}
            onChange={change}
            organizationId={form.organizationId}
          />

          <label className="text-sm">
            <span className="mb-1 block font-medium">Contact Person</span>

            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Email</span>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Phone</span>

            <input
              name="phone"
              value={form.phone}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Rating (0-5)</span>

            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              name="rating"
              value={form.rating}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Qualification Date</span>

            <input
              type="date"
              name="qualificationDate"
              value={form.qualificationDate}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Next Review Date</span>

            <input
              type="date"
              name="nextReviewDate"
              value={form.nextReviewDate}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {supplier && (
            <QMSReferenceSelect
              sourceType="QMS_STATUS"
              name="status"
              label="Status"
              module="SUPPLIER"
              value={form.status}
              onChange={change}
              organizationId={form.organizationId}
            />
          )}

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Address</span>

            <textarea
              name="address"
              value={form.address}
              onChange={change}
              rows={2}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Description</span>

            <textarea
              name="description"
              value={form.description}
              onChange={change}
              rows={3}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border px-4 py-2.5"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-white"
          >
            {saving ? "Saving..." : "Save Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
