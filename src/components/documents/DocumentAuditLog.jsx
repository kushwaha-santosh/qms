"use client";

import { useEffect, useState } from "react";

import { getDocumentAuditLogs } from "@/lib/api/documents.api";

export default function DocumentAuditLog({ open, document, onClose }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !document?._id) {
      return;
    }

    let active = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");
        setLogs([]);
        setPagination(null);

        const response = await getDocumentAuditLogs(document._id);

        if (!active) {
          return;
        }

        /*
         * Depending on documents.api.js, response can be:
         *
         * CASE 1:
         * {
         *   success: true,
         *   data: {
         *     auditLogs: [],
         *     pagination: {}
         *   }
         * }
         *
         * CASE 2:
         * {
         *   auditLogs: [],
         *   pagination: {}
         * }
         *
         * CASE 3:
         * Axios response:
         * {
         *   data: {
         *     success: true,
         *     data: {
         *       auditLogs: [],
         *       pagination: {}
         *     }
         *   }
         * }
         */

        let payload = response;

        /*
         * Axios response
         */
        if (
          payload &&
          payload.data &&
          typeof payload.data === "object" &&
          (payload.status ||
            payload.statusText ||
            payload.config ||
            payload.headers)
        ) {
          payload = payload.data;
        }

        /*
         * API envelope:
         *
         * {
         *   success: true,
         *   data: {...}
         * }
         */
        if (payload && payload.data && typeof payload.data === "object") {
          payload = payload.data;
        }

        /*
         * At this point payload should be:
         *
         * {
         *   auditLogs: [],
         *   pagination: {}
         * }
         */

        const auditLogs = Array.isArray(payload?.auditLogs)
          ? payload.auditLogs
          : Array.isArray(payload?.logs)
            ? payload.logs
            : Array.isArray(payload?.records)
              ? payload.records
              : Array.isArray(payload)
                ? payload
                : [];

        setLogs(auditLogs);

        setPagination(payload?.pagination || null);
      } catch (e) {
        if (!active) {
          return;
        }

        console.error("Document history load error:", e);

        setLogs([]);

        setError(
          e?.response?.data?.message ||
            e?.apiMessage ||
            e?.message ||
            "Unable to load document history.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [open, document?._id]);

  if (!open || !document) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Document History
            </h2>

            <div className="mt-1 text-sm text-slate-500">
              {document.documentNumber || "Document"}

              {document.title ? ` — ${document.title}` : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* Loading */}

          {loading && (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="text-sm text-slate-500">
                Loading document history...
              </div>
            </div>
          )}

          {/* Error */}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Empty */}

          {!loading && !error && logs.length === 0 && (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  No history found.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No audit activity is available for this document.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================
              AUDIT LOGS
          ================================================== */}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const logId = log?._id || `${log?.createdAt || "log"}-${index}`;

                /*
                 * Resolve actor name.
                 *
                 * createAuditLog stores userName/userEmail,
                 * but populated userId can also be available.
                 */

                const populatedUser =
                  log?.userId && typeof log.userId === "object"
                    ? log.userId
                    : null;

                const populatedName = [
                  populatedUser?.firstName,
                  populatedUser?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim();

                const actorName =
                  log?.userName ||
                  populatedName ||
                  populatedUser?.name ||
                  populatedUser?.fullName ||
                  populatedUser?.email ||
                  log?.userEmail ||
                  "System";

                const action = String(log?.action || "ACTION")
                  .trim()
                  .replace(/_/g, " ");

                const formattedAction = action
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase());

                return (
                  <div
                    key={String(logId)}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* Top row */}

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formattedAction}
                        </span>

                        {log?.module && (
                          <span className="text-xs text-slate-400">
                            {log.module}
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500">
                        {log?.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "—"}
                      </span>
                    </div>

                    {/* Description */}

                    <div className="mt-3">
                      <p className="text-sm leading-6 text-slate-800">
                        {log?.description || "No description available."}
                      </p>
                    </div>

                    {/* Actor */}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-600">By:</span>{" "}
                        {actorName}
                      </span>

                      {log?.userEmail && <span>{log.userEmail}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================================================
              PAGINATION SUMMARY
          ================================================== */}

          {!loading && !error && pagination && pagination.total > 0 && (
            <div className="mt-5 border-t pt-3 text-xs text-slate-500">
              Showing {logs.length} of {pagination.total} history record
              {pagination.total === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
