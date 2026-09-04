"use client";

import { useEffect, useState } from "react";
import { getTrainingAuditLogs } from "@/lib/api/training.api";

const normalizeLogs = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.auditLogs)) {
    return response.auditLogs;
  }

  if (Array.isArray(response?.logs)) {
    return response.logs;
  }

  if (Array.isArray(response?.records)) {
    return response.records;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.auditLogs)) {
    return response.data.auditLogs;
  }

  if (Array.isArray(response?.data?.logs)) {
    return response.data.logs;
  }

  return [];
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAction = (value) => {
  if (!value) return "—";

  return String(value)
    .trim()
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getUserName = (log) => {
  if (log?.userName) {
    return log.userName;
  }

  if (log?.userId) {
    const firstName = log.userId.firstName || "";

    const lastName = log.userId.lastName || "";

    const name = `${firstName} ${lastName}`.trim();

    return (
      name ||
      log.userId.name ||
      log.userId.fullName ||
      log.userId.email ||
      "System"
    );
  }

  return "System";
};

const getUserEmail = (log) => {
  return log?.userEmail || log?.userId?.email || "";
};

export default function TrainingAuditLog({ open, record, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !record?._id) {
      setLogs([]);
      setError("");
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getTrainingAuditLogs(record._id);

        console.log("Training audit API response:", response);

        const normalized = normalizeLogs(response);

        console.log("Training audit logs:", normalized);

        if (!cancelled) {
          setLogs(normalized);
        }
      } catch (e) {
        console.error("Failed to load training audit logs:", e);

        if (!cancelled) {
          setLogs([]);
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to load training history.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [open, record?._id]);

  if (!open || !record) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Training History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {record.trainingNumber || record.title || "Training"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {loading && (
            <div className="rounded-xl border bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading history...
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="rounded-xl border bg-slate-50 p-6 text-center text-sm text-slate-500">
              No history available for this training.
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const userName = getUserName(log);

                const userEmail = getUserEmail(log);

                return (
                  <div
                    key={log?._id || `${log?.createdAt || ""}-${index}`}
                    className="rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatAction(log?.action)}
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          {log?.description || "—"}
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        {formatDateTime(log?.createdAt)}
                      </div>
                    </div>

                    <div className="mt-3 border-t pt-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Performed By
                      </div>

                      <div className="mt-1 text-sm text-slate-700">
                        {userName}
                      </div>

                      {userEmail && (
                        <div className="text-xs text-slate-500">
                          {userEmail}
                        </div>
                      )}
                    </div>

                    {(log?.oldData || log?.newData) && (
                      <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
                        {log?.oldData && (
                          <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Previous Value
                            </div>

                            <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                              {JSON.stringify(log.oldData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log?.newData && (
                          <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              New Value
                            </div>

                            <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
