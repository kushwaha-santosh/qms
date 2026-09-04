"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} from "@/lib/api/product.api";

import { getMasterData } from "@/lib/api/masterData.api";

import ProductTable from "@/components/products/ProductTable";
import ProductFormModal from "@/components/products/ProductFormModal";
import ProductPagination from "@/components/products/ProductPagination";
import ProductStatusModal from "@/components/products/ProductStatusModal";
import ProductDeleteModal from "@/components/products/ProductDeleteModal";

import { useAuth } from "@/context/AuthProvider";

// ==========================================================
// HELPERS
// ==========================================================

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

const MASTER_LIMIT = 100;

// ==========================================================
// PAGE
// ==========================================================

export default function ProductsPage() {
  // const { user: currentUser, hasPermission } = useAuth();

  const { user: currentUser, hasPermission } = useAuth();

  // --------------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------------

  const canView =
    currentUser?.role === "SUPER_ADMIN" ||
    hasPermission?.("PRODUCT_VIEW") === true;

  const canCreate =
    currentUser?.role === "SUPER_ADMIN" ||
    hasPermission?.("PRODUCT_CREATE") === true;

  const canUpdate =
    currentUser?.role === "SUPER_ADMIN" ||
    hasPermission?.("PRODUCT_UPDATE") === true;

  const canDelete =
    currentUser?.role !== "SUPER_ADMIN" &&
    hasPermission?.("PRODUCT_DELETE") === true;

  const canStatusUpdate =
    currentUser?.role === "SUPER_ADMIN" ||
    hasPermission?.("PRODUCT_STATUS_UPDATE") === true;

  // --------------------------------------------------------
  // PRODUCT STATE
  // --------------------------------------------------------

  const [products, setProducts] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [brandFilter, setBrandFilter] = useState("");

  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------------
  // MASTER FILTER OPTIONS
  // --------------------------------------------------------

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: [],
    productTypes: [],
  });

  const [loadingFilters, setLoadingFilters] = useState(false);

  const [filterLoadError, setFilterLoadError] = useState("");

  // --------------------------------------------------------
  // MODALS
  // --------------------------------------------------------

  const [formModal, setFormModal] = useState({
    open: false,
    product: null,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    product: null,
    nextStatus: false,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
  });

  // ========================================================
  // LOAD FILTER MASTER DATA
  // ========================================================

  const loadFilterOptions = useCallback(async () => {
    try {
      setLoadingFilters(true);
      setFilterLoadError("");

      const [categoryResponse, brandResponse, productTypeResponse] =
        await Promise.all([
          getMasterData("PRODUCT_CATEGORY", {
            includeInactive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),

          getMasterData("BRAND", {
            includeInactive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),

          getMasterData("PRODUCT_TYPE", {
            includeInactive: true,
            page: 1,
            limit: MASTER_LIMIT,
          }),
        ]);

      setFilterOptions({
        categories: getMasterItems(categoryResponse),

        brands: getMasterItems(brandResponse),

        productTypes: getMasterItems(productTypeResponse),
      });
    } catch (err) {
      console.error("[Products Filter Master Data Error]", err);

      setFilterLoadError(
        err?.message || "Unable to load product filter options.",
      );
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  // ========================================================
  // LOAD PRODUCTS
  // ========================================================

  const loadProducts = useCallback(
    async (requestedPage = 1) => {
      if (!canView) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getProducts({
          page: requestedPage,

          limit: pagination.limit,

          search,

          isActive: status,

          categoryId: categoryFilter,

          brandId: brandFilter,

          productTypeId: productTypeFilter,
          scope: scopeFilter,
        });

        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response)
              ? response
              : [];

        setProducts(items);

        setPagination(
          response?.pagination || {
            page: requestedPage,
            limit: pagination.limit,
            total: items.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: requestedPage > 1,
          },
        );
      } catch (err) {
        console.error("[Products Load Error]", err);

        setError(err?.message || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    },
    [
      canView,
      pagination.limit,
      search,
      status,
      categoryFilter,
      brandFilter,
      productTypeFilter,
      scopeFilter,
    ],
  );

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    if (!canView) {
      return;
    }

    loadFilterOptions();
  }, [canView, loadFilterOptions]);

  useEffect(() => {
    if (!canView) {
      return;
    }

    loadProducts(1);
  }, [
    canView,
    search,
    status,
    categoryFilter,
    brandFilter,
    productTypeFilter,
    loadProducts,
  ]);

  // ========================================================
  // CREATE
  // ========================================================

  const handleCreate = () => {
    setFormModal({
      open: true,
      product: null,
    });
  };

  // ========================================================
  // EDIT
  // ========================================================

  const handleEdit = (product) => {
    setFormModal({
      open: true,
      product,
    });
  };

  // ========================================================
  // FORM SUBMIT
  // ========================================================

  const handleFormSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");

      if (formModal.product) {
        await updateProduct(formModal.product._id, data);
      } else {
        await createProduct(data);
      }

      setFormModal({
        open: false,
        product: null,
      });

      await loadProducts(formModal.product ? pagination.page : 1);
    } catch (err) {
      console.error("[Product Save Error]", err);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // STATUS CHANGE REQUEST
  // ========================================================

  const handleStatusChange = (product) => {
    const nextStatus = !product.isActive;

    setStatusModal({
      open: true,
      product,
      nextStatus,
    });
  };

  // ========================================================
  // CONFIRM STATUS CHANGE
  // ========================================================

  const handleConfirmStatus = async () => {
    if (!statusModal.product) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");

      await updateProductStatus(
        statusModal.product._id,
        statusModal.nextStatus,
      );

      setStatusModal({
        open: false,
        product: null,
        nextStatus: false,
      });

      await loadProducts(pagination.page);
    } catch (err) {
      console.error("[Product Status Error]", err);

      setError(err?.message || "Unable to update product status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ========================================================
  // DELETE REQUEST
  // ========================================================

  const handleDelete = (product) => {
    setDeleteModal({
      open: true,
      product,
    });
  };

  // ========================================================
  // CONFIRM DELETE
  // ========================================================

  const handleConfirmDelete = async () => {
    if (!deleteModal.product) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteProduct(deleteModal.product._id);

      setDeleteModal({
        open: false,
        product: null,
      });

      const nextPage =
        products.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadProducts(nextPage);
    } catch (err) {
      console.error("[Product Delete Error]", err);

      setError(err?.message || "Unable to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  // ========================================================
  // PAGINATION
  // ========================================================

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }

    loadProducts(page);
  };

  // ========================================================
  // RESET FILTERS
  // ========================================================

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setCategoryFilter("");
    setBrandFilter("");
    setProductTypeFilter("");
    setScopeFilter("");
  };

  // ========================================================
  // ACCESS DENIED
  // ========================================================

  if (currentUser && !canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>

          <p className="mt-2 text-sm text-red-700">
            You do not have permission to view products.
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product master information, UOM and quantities.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter master-data error */}
      {filterLoadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {filterLoadError}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          {/* Search */}
          <div className="md:col-span-1">
            <label
              htmlFor="product-search"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Search
            </label>

            <input
              id="product-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code, model number..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {/* Scope */}
          {currentUser?.role === "SUPER_ADMIN" && (
            <div>
              <label
                htmlFor="product-scope-filter"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Scope
              </label>

              <select
                id="product-scope-filter"
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value)}
                disabled={loadingFilters}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Scopes</option>
                <option value="SYSTEM">System</option>
                <option value="ORGANIZATION">Organization</option>
              </select>
            </div>
          )}
          {/* Category */}
          <div>
            <label
              htmlFor="product-category-filter"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Category
            </label>

            <select
              id="product-category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              disabled={loadingFilters}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">All Categories</option>

              {filterOptions.categories.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                  {item.code ? ` (${item.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label
              htmlFor="product-brand-filter"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Brand
            </label>

            <select
              id="product-brand-filter"
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              disabled={loadingFilters}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">All Brands</option>

              {filterOptions.brands.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                  {item.code ? ` (${item.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type */}
          <div>
            <label
              htmlFor="product-type-filter"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Product Type
            </label>

            <select
              id="product-type-filter"
              value={productTypeFilter}
              onChange={(event) => setProductTypeFilter(event.target.value)}
              disabled={loadingFilters}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">All Product Types</option>

              {filterOptions.productTypes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                  {item.code ? ` (${item.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="product-status-filter"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Status
            </label>

            <select
              id="product-status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Status</option>

              <option value="true">Active</option>

              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <ProductTable
          products={products}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canStatusUpdate={canStatusUpdate}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination */}
      <ProductPagination
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Product Form */}
      {/* <ProductFormModal
        open={formModal.open}
        product={formModal.product}
        loading={saving}
        onClose={() =>
          setFormModal({
            open: false,
            product: null,
          })
        }
        onSubmit={handleFormSubmit}
        currentUser={currentUser}
      /> */}
      <ProductFormModal
        open={formModal.open}
        product={formModal.product}
        loading={saving}
        onClose={() =>
          setFormModal({
            open: false,
            product: null,
          })
        }
        onSubmit={handleFormSubmit}
        currentUser={currentUser}
      />

      {/* Status Confirmation */}
      <ProductStatusModal
        open={statusModal.open}
        product={statusModal.product}
        nextStatus={statusModal.nextStatus}
        loading={updatingStatus}
        onClose={() =>
          setStatusModal({
            open: false,
            product: null,
            nextStatus: false,
          })
        }
        onConfirm={handleConfirmStatus}
      />

      {/* Delete Confirmation */}
      <ProductDeleteModal
        open={deleteModal.open}
        product={deleteModal.product}
        loading={deleting}
        onClose={() =>
          setDeleteModal({
            open: false,
            product: null,
          })
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
