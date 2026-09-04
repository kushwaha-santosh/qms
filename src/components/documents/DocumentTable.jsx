"use client";

const idOf = (v) => String(v?._id || v?.id || v || "");

const userName = (v) =>
  [v?.firstName, v?.lastName].filter(Boolean).join(" ") || v?.email || "—";

const formatStatus = (value) =>
  !value
    ? "—"
    : String(value)
        .trim()
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export default function DocumentTable({
  isSuperAdmin = false,
  documents = [],
  canEdit,
  canDelete,
  canStatus,
  onEdit,
  onDelete,
  onStatus,
  onDetails,
  onHistory,
  onViewDocument,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table
        className={`min-w-[1100px] w-full ${
          isSuperAdmin ? "min-w-[1250px]" : ""
        }`}
      >
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 ">
          <tr>
            <th className="px-4 py-3">Number</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Revision</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {documents.length ? (
            documents.map((d) => {
              const fileSource = String(d.fileSource || "")
                .trim()
                .toUpperCase();

              const hasDocument =
                Boolean(d.fileStorageKey) || Boolean(d.fileUrl);

              const canViewDocument =
                fileSource === "UPLOAD" ||
                (fileSource === "URL" && Boolean(d.fileUrl)) ||
                (!fileSource && hasDocument);

              return (
                <tr
                  key={idOf(d)}
                  className="hover:bg-slate-50 whitespace-nowrap"
                >
                  <td className="px-4 py-3 font-medium">{d.documentNumber}</td>

                  <td className="px-4 py-3">{d.title}</td>

                  <td className="px-4 py-3">{d.documentType || "—"}</td>

                  <td className="px-4 py-3">{d.department || "—"}</td>

                  <td className="px-4 py-3">{d.revision || "0"}</td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!canStatus}
                      onClick={() => onStatus?.(d)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium disabled:cursor-default"
                    >
                      {formatStatus(d.status)}
                    </button>
                  </td>

                  <td className="px-4 py-3">{userName(d.owner)}</td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {/* View Document */}
                      {canViewDocument && (
                        <button
                          type="button"
                          onClick={() => onViewDocument?.(d)}
                          disabled={!d.fileUrl && !d.fileStorageKey}
                          className="rounded-lg border px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          View
                        </button>
                      )}

                      {/* Details */}
                      <button
                        type="button"
                        onClick={() => onDetails?.(d)}
                        className="rounded-lg border px-2.5 py-1.5"
                      >
                        Details
                      </button>

                      {/* History / Audit Log */}
                      <button
                        type="button"
                        onClick={() => onHistory?.(d)}
                        className="rounded-lg border px-2.5 py-1.5"
                      >
                        History
                      </button>

                      {/* Status */}
                      {canStatus && (
                        <button
                          type="button"
                          onClick={() => onStatus?.(d)}
                          className="rounded-lg border px-2.5 py-1.5"
                        >
                          Status
                        </button>
                      )}

                      {/* Edit */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(d)}
                          className="rounded-lg border px-2.5 py-1.5"
                        >
                          Edit
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(d)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                No documents found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
