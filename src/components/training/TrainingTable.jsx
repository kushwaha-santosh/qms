"use client";
const pretty = (v) =>
  String(v || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const date = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
};
export default function TrainingTable({
  records = [],
  canEdit,
  canDelete,
  canStatus,
  onEdit,
  onDelete,
  onStatus,
  onDetails,
  onHistory,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            {["Code", "Name", "Type", "Status", "Date", "Actions"].map((x) => (
              <th
                key={x}
                className={`px-4 py-3 font-medium ${x === "Actions" ? "text-center" : ""}`}
              >
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id} className="border-t">
              <td className="px-4 py-3 font-medium">{r.trainingNumber}</td>
              <td className="px-4 py-3">{r.title}</td>
              <td className="px-4 py-3">{pretty(r.trainingType)}</td>
              <td className="px-4 py-3">{pretty(r.status)}</td>
              <td className="px-4 py-3">{date(r.scheduledDate)}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => onDetails(r)}
                    className="rounded-lg border px-2.5 py-1.5"
                  >
                    View
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onEdit(r)}
                      className="rounded-lg border px-2.5 py-1.5"
                    >
                      Edit
                    </button>
                  )}
                  {canStatus && (
                    <button
                      onClick={() => onStatus(r)}
                      className="rounded-lg border px-2.5 py-1.5"
                    >
                      Status
                    </button>
                  )}
                  <button
                    onClick={() => onHistory(r)}
                    className="rounded-lg border px-2.5 py-1.5"
                  >
                    History
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(r)}
                      className="rounded-lg border px-2.5 py-1.5 text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!records.length && (
            <tr>
              <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
