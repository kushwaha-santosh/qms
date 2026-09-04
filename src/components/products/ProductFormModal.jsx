"use client";

import { useEffect, useMemo, useState } from "react";

import { getMasterData } from "@/lib/api/masterData.api";
import { getOrganizations } from "@/lib/api/organization.api";

const EMPTY_FORM = {
  code: "",
  name: "",
  modelNumber: "",
  organizationId: "",
  isSystem: false,
  categoryId: "",
  uomId: "",
  brandId: "",
  productTypeId: "",
  quantity: "1",
  description: "",
};

const MASTER_LIMIT = 100;
const ORGANIZATION_LIMIT = 100;

const getMasterItems = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
};

const getOrganizationItems = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.organizations)) {
    return response.data.organizations;
  }

  if (Array.isArray(response?.organizations)) {
    return response.organizations;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
};

const valueOf = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "object" && value?._id) {
    return String(value._id);
  }

  if (typeof value === "object" && value?.id) {
    return String(value.id);
  }

  return String(value);
};

const getRole = (user) => {
  return (
    user?.role ||
    user?.user?.role ||
    user?.data?.role ||
    user?.data?.user?.role ||
    ""
  );
};

export default function ProductFormModal({
  open,
  product = null,
  item = null,
  currentUser = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const editingProduct = product || item || null;

  const [form, setForm] = useState(EMPTY_FORM);

  const [organizations, setOrganizations] = useState([]);

  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  const [masterLoading, setMasterLoading] = useState(false);
  const [organizationLoading, setOrganizationLoading] = useState(false);

  const [error, setError] = useState("");

  const isEdit = Boolean(editingProduct?._id || editingProduct?.id);

  const currentUserRole = getRole(currentUser);

  const isSuperAdmin = String(currentUserRole).toUpperCase() === "SUPER_ADMIN";

  // ------------------------------------------------------------
  // DEBUG
  // ------------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }
  }, [open, currentUser, currentUserRole, isSuperAdmin]);

  // ------------------------------------------------------------
  // INITIALIZE FORM
  // ------------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!editingProduct) {
      setForm({
        ...EMPTY_FORM,

        organizationId: isSuperAdmin
          ? ""
          : valueOf(currentUser?.organizationId),

        isSystem: false,
      });

      setError("");

      return;
    }

    const organizationId = valueOf(editingProduct.organizationId);

    const existingIsSystem =
      editingProduct.isSystem === true || !organizationId;

    setForm({
      code: valueOf(editingProduct.code),

      name: valueOf(editingProduct.name),

      modelNumber: valueOf(editingProduct.modelNumber),

      organizationId: existingIsSystem ? "" : organizationId,

      isSystem: existingIsSystem,

      categoryId:
        valueOf(editingProduct.categoryId) ||
        valueOf(editingProduct.category?._id) ||
        valueOf(editingProduct.category?.id),

      uomId:
        valueOf(editingProduct.uomId) ||
        valueOf(editingProduct.uom?._id) ||
        valueOf(editingProduct.uom?.id),

      brandId:
        valueOf(editingProduct.brandId) ||
        valueOf(editingProduct.brand?._id) ||
        valueOf(editingProduct.brand?.id),

      productTypeId:
        valueOf(editingProduct.productTypeId) ||
        valueOf(editingProduct.productType?._id) ||
        valueOf(editingProduct.productType?.id),

      quantity:
        editingProduct.quantity == null ? "1" : String(editingProduct.quantity),

      description: valueOf(editingProduct.description),
    });

    setError("");
  }, [open, editingProduct, currentUser, isSuperAdmin]);

  // ------------------------------------------------------------
  // LOAD MASTER DATA
  // ------------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadMasterData = async () => {
      setMasterLoading(true);

      try {
        const [
          categoryResponse,
          uomResponse,
          brandResponse,
          productTypeResponse,
        ] = await Promise.all([
          getMasterData("PRODUCT_CATEGORY", {
            isActive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),

          getMasterData("UOM", {
            isActive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),

          getMasterData("BRAND", {
            isActive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),

          getMasterData("PRODUCT_TYPE", {
            isActive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(getMasterItems(categoryResponse));

        setUoms(getMasterItems(uomResponse));

        setBrands(getMasterItems(brandResponse));

        setProductTypes(getMasterItems(productTypeResponse));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Unable to load product master data.",
          );
        }
      } finally {
        if (!cancelled) {
          setMasterLoading(false);
        }
      }
    };

    loadMasterData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ------------------------------------------------------------
  // LOAD ORGANIZATIONS
  // ------------------------------------------------------------

  useEffect(() => {
    if (!open || !isSuperAdmin) {
      return;
    }

    let cancelled = false;

    const loadOrganizations = async () => {
      setOrganizationLoading(true);

      try {
        const response = await getOrganizations({
          status: "ACTIVE",
          page: 1,
          limit: ORGANIZATION_LIMIT,
        });

        if (!cancelled) {
          setOrganizations(getOrganizationItems(response));
        }
      } catch (loadError) {
        if (!cancelled) {
          setOrganizations([]);

          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Unable to load organizations.",
          );
        }
      } finally {
        if (!cancelled) {
          setOrganizationLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin]);

  // ------------------------------------------------------------
  // SELECTED UOM
  // ------------------------------------------------------------

  const selectedUom = useMemo(() => {
    if (!form.uomId) {
      return null;
    }

    return (
      uoms.find((item) => valueOf(item?._id || item?.id) === form.uomId) || null
    );
  }, [form.uomId, uoms]);

  const selectedUomText = useMemo(() => {
    return String(selectedUom?.name || selectedUom?.code || "")
      .trim()
      .toLowerCase();
  }, [selectedUom]);

  const isPieceUom =
    selectedUomText === "piece" ||
    selectedUomText === "pieces" ||
    selectedUomText === "pcs" ||
    selectedUomText === "pc";

  // ------------------------------------------------------------
  // CHANGE
  // ------------------------------------------------------------

  const change = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "isSystem") {
      setForm((previous) => ({
        ...previous,

        isSystem: checked,

        organizationId: checked ? "" : previous.organizationId,
      }));

      setError("");

      return;
    }

    setForm((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------

  const submit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const code = form.code.trim().toUpperCase();

    const name = form.name.trim();

    const modelNumber = form.modelNumber.trim();

    if (!code) {
      setError("Product code is required.");
      return;
    }

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!form.uomId) {
      setError("UOM is required.");
      return;
    }

    const numericQuantity = Number(form.quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity < 0) {
      setError("Quantity must be a valid number greater than or equal to 0.");

      return;
    }

    // ----------------------------------------------------------
    // SUPER ADMIN SCOPE
    // ----------------------------------------------------------

    if (isSuperAdmin) {
      if (form.isSystem) {
        if (form.organizationId) {
          setError("A system product cannot belong to an organization.");

          return;
        }
      } else {
        if (!form.organizationId) {
          setError("Please select an organization or enable Use System.");

          return;
        }
      }
    }

    try {
      await onSubmit({
        code,

        name,

        modelNumber,

        organizationId:
          isSuperAdmin && !form.isSystem ? form.organizationId : null,

        isSystem: isSuperAdmin ? form.isSystem : false,

        categoryId: form.categoryId || null,

        uomId: form.uomId,

        brandId: form.brandId || null,

        productTypeId: form.productTypeId || null,

        quantity: numericQuantity,

        description: form.description.trim(),
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save product.",
      );
    }
  };

  // ------------------------------------------------------------
  // CLOSE
  // ------------------------------------------------------------

  const handleClose = () => {
    if (loading) {
      return;
    }

    setError("");

    onClose?.();
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Product" : "Create Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Update the product master information."
                : "Add a new product to the product master."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
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

        {/* FORM */}

        <form onSubmit={submit} className="overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ==================================================
                PRODUCT SCOPE
            ================================================== */}

            {isSuperAdmin && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Product Scope
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose whether this product belongs to a specific
                    organization or is a global system product.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* ORGANIZATION */}

                  <Select
                    name="organizationId"
                    label="Organization"
                    value={form.organizationId}
                    onChange={change}
                    disabled={loading || organizationLoading || form.isSystem}
                    options={organizations}
                    placeholder={
                      form.isSystem
                        ? "System Product"
                        : organizationLoading
                          ? "Loading organizations..."
                          : "Select organization"
                    }
                  />

                  {/* USE SYSTEM */}

                  <div className="flex items-end">
                    <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        name="isSystem"
                        checked={form.isSystem}
                        onChange={change}
                        disabled={loading}
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span>
                        <span className="block text-sm font-medium text-slate-800">
                          Use System
                        </span>

                        <span className="block text-xs text-slate-500">
                          Make this a global product available across
                          organizations.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* SYSTEM MESSAGE */}

                {form.isSystem && (
                  <div className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-700">
                    This product will be global and will not belong to a
                    specific organization.
                  </div>
                )}

                {/* ORGANIZATION MESSAGE */}

                {!form.isSystem && form.organizationId && (
                  <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    This product will belong to the selected organization.
                  </div>
                )}
              </div>
            )}

            {/* ==================================================
                PRODUCT INFORMATION
            ================================================== */}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                name="code"
                label="Product Code *"
                value={form.code}
                onChange={change}
                disabled={loading}
              />

              <Input
                name="name"
                label="Product Name *"
                value={form.name}
                onChange={change}
                disabled={loading}
              />

              <Input
                name="modelNumber"
                label="Model Number"
                value={form.modelNumber}
                onChange={change}
                disabled={loading}
              />

              <Select
                name="categoryId"
                label="Category"
                value={form.categoryId}
                onChange={change}
                disabled={loading || masterLoading}
                options={categories}
                placeholder={
                  masterLoading ? "Loading categories..." : "Select category"
                }
              />

              <Select
                name="uomId"
                label="Unit of Measure *"
                value={form.uomId}
                onChange={change}
                disabled={loading || masterLoading}
                options={uoms}
                placeholder={masterLoading ? "Loading UOM..." : "Select UOM"}
              />

              <Input
                name="quantity"
                label={isPieceUom ? "Number of Pieces *" : "Quantity *"}
                value={form.quantity}
                onChange={change}
                disabled={loading}
                type="number"
                min="0"
                step="any"
                placeholder={
                  isPieceUom ? "Enter number of pieces" : "Enter quantity"
                }
              />

              <Select
                name="brandId"
                label="Brand"
                value={form.brandId}
                onChange={change}
                disabled={loading || masterLoading}
                options={brands}
                placeholder={
                  masterLoading ? "Loading brands..." : "Select brand"
                }
              />

              <Select
                name="productTypeId"
                label="Product Type"
                value={form.productTypeId}
                onChange={change}
                disabled={loading || masterLoading}
                options={productTypes}
                placeholder={
                  masterLoading
                    ? "Loading product types..."
                    : "Select product type"
                }
              />

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={change}
                  disabled={loading}
                  rows={4}
                  placeholder="Enter product description..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || masterLoading || organizationLoading}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// INPUT
// ============================================================

function Input({
  name,
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  min,
  step,
  placeholder,
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
        min={min}
        step={step}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
      />
    </div>
  );
}

// ============================================================
// SELECT
// ============================================================

function Select({
  name,
  label,
  value,
  onChange,
  disabled = false,
  options = [],
  placeholder = "Select",
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => {
          const itemId = option?._id || option?.id;

          const itemName =
            option?.name || option?.label || option?.displayName || "";

          const itemCode = option?.code || "";

          const itemStatus = option?.status || "ACTIVE";

          const itemIsActive =
            option?.isActive !== false &&
            itemStatus !== "INACTIVE" &&
            itemStatus !== "SUSPENDED";

          if (!itemId) {
            return null;
          }

          return (
            <option key={itemId} value={itemId} disabled={!itemIsActive}>
              {itemName}
              {itemCode ? ` (${itemCode})` : ""}
              {!itemIsActive ? " — Inactive" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
