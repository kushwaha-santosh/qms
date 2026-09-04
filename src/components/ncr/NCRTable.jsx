"use client";

const STATUS = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",

  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",

  ACTION_IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",

  VERIFICATION: "bg-purple-50 text-purple-700 border-purple-200",

  REOPENED: "bg-cyan-50 text-cyan-700 border-cyan-200",

  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",

  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function NCRTable({
  ncrs = [],
  loading = false,

  isSuperAdmin = false,

  canEdit = false,
  canDelete = false,
  canChangeStatus = false,

  onView,
  onEdit,
  onStatus,
  onAudit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!ncrs.length) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center text-sm text-slate-500">
        No NCR records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table
        className={`min-w-[1100px] w-full ${
          isSuperAdmin ? "min-w-[1250px]" : ""
        }`}
      >
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              NCR
            </th>

            {isSuperAdmin && (
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Organization
              </th>
            )}

            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Category
            </th>

            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Severity
            </th>

            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>

            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Assigned To
            </th>

            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Detected
            </th>

            <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Due Date
            </th>

            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {ncrs.map((n) => (
            <tr key={n._id} className="hover:bg-slate-50">
              {/* NCR */}

              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onView?.(n)}
                  className="text-left"
                >
                  <div className="whitespace-nowrap font-medium text-slate-900">
                    {n.ncrNumber || n.number || n._id?.slice(-8)}
                  </div>
                  <div className="whitespace-nowrap mt-1 max-w-xs truncate text-sm text-slate-500">
                    {n.title || "Untitled NCR"}
                  </div>
                </button>
              </td>

              {/* ORGANIZATION - SUPER ADMIN ONLY */}

              {isSuperAdmin && (
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                  {organizationName(n.organizationId)}
                </td>
              )}

              {/* CATEGORY */}

              <td className="px-4 py-4 text-sm">{label(n.category)}</td>

              {/* SEVERITY */}

              <td className="px-4 py-4 text-sm font-semibold">
                {label(n.severity)}
              </td>

              {/* STATUS */}

              <td className="px-4 py-4">
                <span
                  className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${
                    STATUS[n.status] || "border-slate-200"
                  }`}
                >
                  {label(n.status)}
                </span>
              </td>

              {/* ASSIGNED */}

              <td className="px-4 py-4 text-sm">
                {person(n.assignedTo) || "—"}
              </td>

              {/* DETECTED */}

              <td className="px-4 py-4 text-sm">
                {fmt(n.detectedAt || n.detectedDate)}
              </td>

              {/* DUE */}

              <td className="px-4 py-4 text-sm">{fmt(n.dueDate)}</td>

              {/* ACTIONS */}

              <td className="whitespace-nowrap px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {btn("View", () => onView?.(n))}

                  {canEdit && btn("Edit", () => onEdit?.(n))}

                  {canChangeStatus && btn("Status", () => onStatus?.(n))}

                  {btn("Audit", () => onAudit?.(n))}

                  {canDelete && btn("Delete", () => onDelete?.(n), true)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function organizationName(value) {
  if (!value) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.displayName ||
    value.companyName ||
    value.code ||
    value.email ||
    "—"
  );
}

const person = (v) =>
  !v
    ? ""
    : typeof v === "string"
      ? v
      : `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.email || "";

const STATUS_LABELS = {
  VERIFICATION: "Pending Verification",

  UNDER_REVIEW: "Under Investigation",

  ACTION_IN_PROGRESS: "Action In Progress",

  REOPENED: "Reopened",
};

const label = (v) =>
  STATUS_LABELS[String(v || "").toUpperCase()] ||
  String(v || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fmt = (v) => (v ? new Date(v).toLocaleDateString() : "—");

const btn = (t, f, d) => (
  <button
    type="button"
    onClick={f}
    className={`rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${
      d ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {t}
  </button>
);
