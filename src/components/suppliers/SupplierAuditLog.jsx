"use client";

import { useEffect, useState } from "react";
import { getSupplierAuditLogs } from "@/lib/api/suppliers.api";

const normalizeLogs = (response) => {
  if (Array.isArray(response)) return response;

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

  if (Array.isArray(response?.data?.records)) {
    return response.data.records;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  if (Array.isArray(response?.data?.result)) {
    return response.data.result;
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
  if (log?.userName) return log.userName;

  if (log?.userId?.firstName || log?.userId?.lastName) {
    return [log.userId.firstName, log.userId.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return "—";
};

const getUserEmail = (log) => {
  if (log?.userEmail) return log.userEmail;

  return log?.userId?.email || "—";
};

const formatData = (value) => {
  if (!value) return null;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function SupplierAuditLog({ open, record, supplier, onClose }) {
  const currentRecord = record || supplier;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !currentRecord?._id) {
      setLogs([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getSupplierAuditLogs(currentRecord._id);

        console.log("SUPPLIER AUDIT LOG RESPONSE:", response);

        const normalized = normalizeLogs(response);

        if (!cancelled) {
          setLogs(normalized);
        }
      } catch (err) {
        console.error("SUPPLIER AUDIT LOG ERROR:", err);

        if (!cancelled) {
          setLogs([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load supplier history.",
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
  }, [open, currentRecord?._id]);

  if (!open || !currentRecord) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Supplier History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {currentRecord.supplierCode || currentRecord.name || "Supplier"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading history...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Logs */}
        {!loading && !error && (
          <div className="mt-5 space-y-4">
            {logs.map((log, index) => {
              const oldData = formatData(log.oldData);
              const newData = formatData(log.newData);

              return (
                <div
                  key={log._id || index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {formatAction(log.action)}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {log.description || "—"}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 sm:text-right">
                      {formatDateTime(
                        log.createdAt || log.timestamp || log.date,
                      )}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Performed By
                    </div>

                    <div className="mt-1 text-sm text-slate-800">
                      {getUserName(log)}
                    </div>

                    {getUserEmail(log) !== "—" && (
                      <div className="text-xs text-slate-500">
                        {getUserEmail(log)}
                      </div>
                    )}
                  </div>

                  {oldData && (
                    <div className="mt-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Previous Data
                      </div>

                      <pre className="max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                        {oldData}
                      </pre>
                    </div>
                  )}

                  {newData && (
                    <div className="mt-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        New Data
                      </div>

                      <pre className="max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                        {newData}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}

            {!logs.length && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No history available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
