"use client";

import { useEffect, useState } from "react";

import { getNCRAuditLogs } from "@/lib/api/ncr.api.js";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const getUserName = (log) => {
  const user = log?.userId;

  if (user) {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return (
      name ||
      user.name ||
      user.fullName ||
      user.email ||
      log.userName ||
      "System"
    );
  }

  return log?.userName || "System";
};

const getUserEmail = (log) => {
  return log?.userEmail || log?.userId?.email || "";
};

const formatRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatAction = (action) => {
  if (!action) {
    return "AUDIT";
  }

  return String(action)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function NCRAuditLog({ open, ncr, onClose }) {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ncr) {
      return;
    }

    const ncrId = ncr._id || ncr.ncrNumber;

    if (!ncrId) {
      setLogs([]);
      setError("NCR ID is required.");
      return;
    }

    let mounted = true;

    const loadLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getNCRAuditLogs(ncrId);

        const auditLogs =
          result?.auditLogs ||
          result?.data?.auditLogs ||
          result?.logs ||
          result?.data?.logs ||
          result?.records ||
          result?.data?.records ||
          (Array.isArray(result) ? result : []);

        if (mounted) {
          setLogs(Array.isArray(auditLogs) ? auditLogs : []);
        }
      } catch (loadError) {
        console.error("NCR audit log error:", loadError);

        if (mounted) {
          setLogs([]);

          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Unable to load audit history.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      mounted = false;
    };
  }, [open, ncr]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      {" "}
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}{" "}
        <div className="flex items-center justify-between border-b px-6 py-4">
          {" "}
          <div>
            {" "}
            <h2 className="text-lg font-semibold text-slate-900">
              Audit History{" "}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {ncr?.ncrNumber || ncr?._id || "NCR"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No audit history found.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const hasChanges =
                  log?.oldData !== undefined || log?.newData !== undefined;

                return (
                  <div
                    key={log?._id || index}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    {/* Action + Date */}
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatAction(log.action)}
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          {log.description || "NCR changed."}
                        </div>
                      </div>

                      <div className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>

                    {/* User information */}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        <strong className="font-medium text-slate-700">
                          {getUserName(log)}
                        </strong>

                        {log?.userId?.role && (
                          <> · {formatRole(log.userId.role)}</>
                        )}

                        {getUserEmail(log) && <> · {getUserEmail(log)}</>}
                      </span>

                      <span>
                        Module:{" "}
                        <strong className="font-medium text-slate-700">
                          {log.module || "NCR"}
                        </strong>
                      </span>
                    </div>

                    {/* Old / New Data */}
                    {/* {hasChanges && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                          View changes
                        </summary>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Previous
                            </div>

                            <pre className="max-h-80 overflow-auto rounded-lg border bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
                              {JSON.stringify(log.oldData, null, 2)}
                            </pre>
                          </div>

                          <div>
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Updated
                            </div>

                            <pre className="max-h-80 overflow-auto rounded-lg border bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    )} */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
