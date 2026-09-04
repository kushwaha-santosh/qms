"use client";

const formatText = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function PermissionTable({
  permissions = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 px-6 py-5"
          >
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="ml-auto h-8 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!permissions.length) {
    return (
      <div className="px-6 py-12 text-center">
        <h3 className="text-sm font-semibold text-gray-900">
          No permissions found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          There are no permissions matching the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Permission
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Module
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Action
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </th>

            {(canUpdate || canDelete) && (
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {permissions.map((permission) => {
            const active = permission?.isActive !== false;

            return (
              <tr
                key={permission?._id}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 align-top">
                  <div>
                    <div className="font-medium text-gray-900">
                      {permission?.name || "-"}
                    </div>

                    <div className="mt-1 font-mono text-xs text-gray-500">
                      {permission?.key || "-"}
                    </div>

                    {permission?.description && (
                      <div className="mt-1 max-w-md text-xs text-gray-400">
                        {permission.description}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 align-top text-sm text-gray-600">
                  {permission?.module || "-"}
                </td>

                <td className="px-6 py-4 align-top">
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {formatText(permission?.action)}
                  </span>
                </td>

                <td className="px-6 py-4 align-top">
                  {canUpdate ? (
                    <div className="relative inline-flex items-center">
                      <span
                        className={`pointer-events-none absolute left-2.5 z-10 h-1.5 w-1.5 rounded-full ${
                          active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />

                      <select
                        value={active ? "ACTIVE" : "INACTIVE"}
                        onChange={(event) => {
                          const nextActive =
                            event.target.value === "ACTIVE";

                          if (nextActive !== active) {
                            onStatusChange?.(
                              permission,
                              nextActive
                            );
                          }
                        }}
                        className={`appearance-none rounded-full border-0 py-1 pl-6 pr-7 text-xs font-medium outline-none ring-1 ring-inset transition focus:ring-2 ${
                          active
                            ? "bg-green-50 text-green-700 ring-green-200 focus:ring-green-400"
                            : "bg-gray-100 text-gray-600 ring-gray-200 focus:ring-gray-400"
                        }`}
                        aria-label={`Change status for ${
                          permission?.name || "permission"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>

                      <span className="pointer-events-none absolute right-2.5 text-current">
                        ▾
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                        active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />

                      {active ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>

                {(canUpdate || canDelete) && (
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(permission)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(permission)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
