"use client";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatName = (user) => {
  if (!user) return "System";

  return (
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "System"
  );
};

export default function MasterDataTable({
  data = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canStatusUpdate = false,
  statusUpdatingId = null,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        No master data found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Code</th>

            <th className="px-4 py-3">Name</th>

            <th className="px-4 py-3">Scope</th>

            <th className="px-4 py-3">Status</th>

            <th className="px-4 py-3">Updated</th>

            {(canUpdate || canDelete || canStatusUpdate) && (
              <th className="px-4 py-3 text-right">Actions</th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((item) => {
            const isStatusUpdating = statusUpdatingId === item._id;

            return (
              <tr key={item._id} className="hover:bg-slate-50/70">
                {/* CODE */}
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {item.code}
                </td>

                {/* NAME */}
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.name}</div>

                  {item.description && (
                    <div className="mt-1 max-w-md text-xs text-slate-500">
                      {item.description}
                    </div>
                  )}
                </td>

                {/* SCOPE */}
                <td className="px-4 py-3 text-xs text-slate-500">
                  {item.isSystem
                    ? "System"
                    : item.organizationId?.name || "Organization"}
                </td>

                {/* STATUS */}
                <td className="px-4 py-3">
                  {canStatusUpdate ? (
                    <div className="relative inline-flex items-center">
                      <select
                        value={item.isActive ? "ACTIVE" : "INACTIVE"}
                        disabled={isStatusUpdating}
                        onChange={(event) => {
                          const newStatus = event.target.value === "ACTIVE";

                          if (newStatus !== Boolean(item.isActive)) {
                            onStatusChange?.(item, newStatus);
                          }
                        }}

                        className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ring-1 ring-inset ${
                          item.isActive
                            ? "bg-green-50 text-green-700 ring-green-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }
                        ${
                          isStatusUpdating
                            ? "cursor-wait opacity-60"
                            : "cursor-pointer"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>

                        <option value="INACTIVE">Inactive</option>
                      </select>

                      {isStatusUpdating && (
                        <span className="ml-2 text-xs text-slate-400">
                          Updating...
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>

                {/* UPDATED */}
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(item.updatedAt)}

                  <div className="mt-1">{formatName(item.updatedBy)}</div>
                </td>

                {/* ACTIONS */}
                {(canUpdate || canDelete || canStatusUpdate) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          disabled={isStatusUpdating}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(item)}
                          disabled={isStatusUpdating}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
