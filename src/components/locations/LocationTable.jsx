"use client";

const formatType = (type) =>
  ({
    COUNTRY: "Country",
    STATE: "State / UT",
    DISTRICT: "District",
    CITY: "City",
    PINCODE: "Pincode",
  })[type] ||
  type ||
  "—";

const getParentName = (item) => item?.parentId?.name || "—";

export default function LocationTable({
  data = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canStatusUpdate = false,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-center px-6 py-12 text-sm text-slate-500">
          Loading locations...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Parent
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pincode
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>

              {(canUpdate || canDelete || canStatusUpdate) && (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const active = item?.isActive !== false;

              return (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {formatType(item.type)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">
                      {item.name}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-slate-500">
                      {item.code || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {getParentName(item)}
                  </td>

                  <td className="px-5 py-4 font-mono text-sm text-slate-600">
                    {item.pincode || "—"}
                  </td>

                  <td className="px-4 py-4">
                    {canStatusUpdate ? (
                      <select
                        value={active ? "ACTIVE" : "INACTIVE"}
                        onChange={(event) => {
                          const next = event.target.value === "ACTIVE";

                          if (next !== active) {
                            onStatusChange?.(item, next);
                          }
                        }}

                        className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ring-1 ring-inset  ${
                          active
                            ? "bg-green-50 text-green-700 ring-green-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>

                        <option value="INACTIVE">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>

                  {(canUpdate || canDelete) && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(item)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete?.(item)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
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

      {!data.length && (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No locations found.
        </div>
      )}
    </div>
  );
}
