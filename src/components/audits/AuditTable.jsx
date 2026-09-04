"use client";

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

const label = (value) => {
  const normalized = normalize(
    typeof value === "object"
      ? value?.code || value?.key || value?.name || value?.label || ""
      : value,
  );

  if (!normalized) {
    return "—";
  }

  return normalized
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const person = (value) => {
  if (!value) {
    return "—";
  }

  if (typeof value === "object") {
    return (
      `${value?.firstName || ""} ${value?.lastName || ""}`.trim() ||
      value?.email ||
      "—"
    );
  }

  return String(value);
};

export default function AuditTable({
  audits = [],
  loading = false,
  onView,
  onEdit,
  onStatus,
  onAudit,
  onDelete,
  canEdit = false,
  canDelete = false,
  canStatus = false,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8">Loading audits...</div>
    );
  }

  if (!audits.length) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        No audit records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-[1150px] w-full">
        <thead className="border-b bg-slate-50">
          <tr>
            {[
              "Audit",
              "Type",
              "Status",
              "Lead Auditor",
              "Audit Date",
              "Due Date",
              "Department",
              "Actions",
            ].map((title) => (
              <th
                key={title}
                // ${title === "Actions" || title === "Audit" ? "text-center" : "text-left"}
                className={`"px-4 py-3 text-center text-[11px] font-semibold uppercase text-slate-500"
                 
                  `}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y">
          {audits.map((audit) => {
            const status = audit?.status;

            const statusLabel = label(status);

            return (
              <tr key={audit?._id} className="hover:bg-slate-50">
                {/* AUDIT */}

                <td className="px-4 py-4">
                  <button onClick={() => onView?.(audit)} className="text-left">
                    <div className="font-medium">
                      {audit?.auditNumber || "—"}
                    </div>

                    <div className="mt-1 max-w-xs truncate text-sm text-slate-500">
                      {audit?.title || "Untitled Audit"}
                    </div>
                  </button>
                </td>

                {/* TYPE */}

                <td className="px-4 py-4 text-sm">{label(audit?.auditType)}</td>

                {/* STATUS */}

                <td className="px-4 py-4">
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    {statusLabel}
                  </span>
                </td>

                {/* LEAD AUDITOR */}

                <td className="px-4 py-4 text-sm">
                  {person(audit?.leadAuditor)}
                </td>

                {/* AUDIT DATE */}

                <td className="px-4 py-4 text-sm">
                  {audit?.auditDate
                    ? new Date(audit.auditDate).toLocaleDateString()
                    : "—"}
                </td>

                {/* DUE DATE */}

                <td className="px-4 py-4 text-sm">
                  {audit?.dueDate
                    ? new Date(audit.dueDate).toLocaleDateString()
                    : "—"}
                </td>

                {/* DEPARTMENT */}

                <td className="px-4 py-4 text-sm">
                  {audit?.department || "—"}
                </td>

                {/* ACTIONS */}

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView?.(audit)}
                      className="rounded-lg border px-3 py-1.5 text-xs"
                    >
                      View
                    </button>

                    <button
                      disabled={!canEdit}
                      onClick={() => onEdit?.(audit)}
                      className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Edit
                    </button>

                    <button
                      disabled={!canStatus}
                      onClick={() => onStatus?.(audit)}
                      className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Status
                    </button>

                    <button
                      onClick={() => onAudit?.(audit)}
                      className="rounded-lg border px-3 py-1.5 text-xs"
                    >
                      Audit
                    </button>

                    <button
                      disabled={!canDelete}
                      onClick={() => onDelete?.(audit)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
