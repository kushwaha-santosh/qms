"use client";

const nameOf = (user) => {
  if (!user) return "-";
  return (
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.name ||
    user.fullName ||
    user.email ||
    "-"
  );
};
const orgOf = (capa) => {
  const org = capa?.organizationId;
  if (org && typeof org === "object") return org.name || org.displayName || "-";
  return capa?.organizationName || "-";
};
const label = (v) =>
  String(v || "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function CAPATable({
  capas = [],
  showOrganization = false,
  onView,
  onEdit,
  onStatus,
  onAssign,
  onAudit,
  onDelete,
}) {
  if (!capas.length)
    return (
      <div className="rounded-xl border bg-white py-16 text-center text-sm text-slate-500">
        No CAPAs found.
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              CAPA
            </th>
            {showOrganization && (
              <th className=" whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Organization
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Assigned To
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Due Date
            </th>
            <th className=" whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {capas.map((capa) => (
            <tr key={capa._id} className="hover:bg-slate-50">
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onView?.(capa)}
                  className="text-left"
                >
                  <div className="whitespace-nowrap font-medium text-slate-900">
                    {capa.capaNumber || "-"}
                  </div>
                  <div className="whitespace-nowrap mt-1 max-w-xs truncate text-sm text-slate-500">
                    {capa.title || "-"}
                  </div>
                </button>
              </td>
              {showOrganization && (
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                  {orgOf(capa)}
                </td>
              )}
              <td className="px-4 py-4 text-sm text-slate-600">
                {label(capa.category)}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {label(capa.severity)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                {nameOf(capa.assignedTo)}
              </td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {capa.dueDate
                  ? new Date(capa.dueDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-4">
                <span className="whitespace-nowrap inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {label(capa.status)}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-1">
                  {onView && (
                    <button
                      type="button"
                      onClick={() => onView(capa)}
                      className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 `}
                    >
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(capa)}
                      className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 `}
                    >
                      Edit
                    </button>
                  )}
                  {onStatus && (
                    <button
                      type="button"
                      onClick={() => onStatus(capa)}
                      className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 `}
                    >
                      Status
                    </button>
                  )}
                  {onAssign && (
                    <button
                      type="button"
                      onClick={() => onAssign(capa)}
                      className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 `}
                    >
                      Assign
                    </button>
                  )}
                  {onAudit && (
                    <button
                      type="button"
                      onClick={() => onAudit(capa)}
                      className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 `}
                    >
                      Audit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(capa)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
