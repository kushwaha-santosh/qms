"use client";
import { useAuth } from "@/context/AuthProvider";
export default function ProductTable({
  products = [],
  data = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canStatusUpdate = false,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const rows = Array.isArray(products) ? products : data;

  const effectiveCanDelete = isSuperAdmin || canDelete;
  const handleStatusChange = (product, event) => {
    const value = event.target.value;

    const newIsActive = value === "true";

    if (Boolean(product.isActive) === newIsActive) {
      return;
    }

    onStatusChange?.(product, newIsActive);
  };

  const hasActions = canUpdate || canDelete;

  const columnCount = hasActions ? 9 : 8;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Code
              </th>

              <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                UOM
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Brand
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product Type
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              {hasActions && (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  Loading products...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              rows.map((product, index) => {
                const categoryName =
                  product.categoryId?.name || product.category || "—";

                const uomName =
                  product.uomId?.name ||
                  product.uom?.name ||
                  product.uomId?.code ||
                  product.uom?.code ||
                  "—";

                const brandName =
                  product.brandId?.name || product.brand?.name || "—";

                const productTypeName =
                  product.productTypeId?.name ||
                  product.productType?.name ||
                  "—";

                const rowKey =
                  product?._id ||
                  product?.id ||
                  product?.code ||
                  `product-${index}`;

                return (
                  <tr key={rowKey} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">
                      {product.code || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {product.name || "—"}
                      </div>

                      {product.modelNumber && (
                        <div className="mt-0.5 text-xs text-slate-500">
                          Model: {product.modelNumber}
                        </div>
                      )}

                      {product.quantity !== undefined &&
                        product.quantity !== null && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {product.quantity} {uomName}
                          </div>
                        )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {categoryName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {uomName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {brandName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {productTypeName}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                      <div
                        className="truncate"
                        title={product.description || ""}
                      >
                        {product.description || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {product.isSystem ? "System" : "Organization"}
                    </td>

                    <td className="px-5 py-4">
                      {canStatusUpdate ? (
                        <select
                          value={product.isActive ? "true" : "false"}
                          onChange={(event) =>
                            handleStatusChange(product, event)
                          }
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-gray-300 ${
                            product.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          aria-label={`Change status for ${
                            product.name || "product"
                          }`}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>

                    {hasActions && (
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => onEdit?.(product)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                          )}

                          {effectiveCanDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete?.(product)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
