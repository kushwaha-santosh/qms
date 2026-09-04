"use client";

import { useEffect, useState } from "react";

import { getAuditLogById } from "@/lib/api/auditLogs.api.js";

// ==========================================================
// HELPERS
// ==========================================================

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

const formatJson = (value) => {
  if (value === null || value === undefined) {
    return "No data";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// ==========================================================
// COMPONENT
// ==========================================================

export default function AuditLogDetailsModal({ open, auditLog, onClose }) {
  const [detail, setDetail] = useState(auditLog);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ========================================================
  // LOAD DETAIL
  // ========================================================

  useEffect(() => {
    if (!open || !auditLog?._id) {
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAuditLogById(auditLog._id);

        const result = response?.data;

        if (!result?.success) {
          throw new Error(
            result?.message || "Unable to retrieve audit log details.",
          );
        }

        if (!cancelled) {
          setDetail(result?.data?.auditLog || auditLog);
        }
      } catch (requestError) {
        console.error("Audit log details request error:", requestError);

        if (!cancelled) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.apiMessage ||
              requestError?.message ||
              "Unable to retrieve audit log details.",
          );

          // Keep the row data available even if
          // the detail request fails.
          setDetail(auditLog);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, auditLog]);

  // ========================================================
  // CLOSE
  // ========================================================

  if (!open || !auditLog) {
    return null;
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Audit Log Details
            </h2>

            <p className="mt-1 truncate text-sm text-gray-500">
              {detail?.description || "Audit log details"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
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

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm text-gray-500">
              Loading audit log details...
            </div>
          </div>
        ) : (
          <>
            {/* ============================================== */}
            {/* SUMMARY */}
            {/* ============================================== */}

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Date" value={formatDate(detail?.createdAt)} />

              <DetailItem label="User" value={detail?.userName || "System"} />

              <DetailItem label="Email" value={detail?.userEmail || "-"} />

              <DetailItem label="Module" value={detail?.module} />

              <DetailItem label="Action" value={detail?.action} />

              <DetailItem
                label="Record ID"
                value={detail?.recordId ? String(detail.recordId) : "-"}
              />

              <DetailItem
                label="Organization"
                value={detail?.organizationId?.name || "Global"}
              />

              <DetailItem label="IP Address" value={detail?.ipAddress || "-"} />

              <DetailItem label="User Agent" value={detail?.userAgent || "-"} />
            </div>

            {/* ============================================== */}
            {/* DESCRIPTION */}
            {/* ============================================== */}

            <div className="px-6 pb-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Description
              </h3>

              <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                {detail?.description || "-"}
              </div>
            </div>

            {/* ============================================== */}
            {/* OLD / NEW DATA */}
            {/* ============================================== */}

            <div className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Old Data
                </h3>

                <pre className="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-white">
                  {formatJson(detail?.oldData)}
                </pre>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  New Data
                </h3>

                <pre className="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-white">
                  {formatJson(detail?.newData)}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="flex justify-end border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// DETAIL ITEM
// ==========================================================

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border bg-gray-50 p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>

      <div className="mt-1 break-words text-sm text-gray-900">
        {value || "-"}
      </div>
    </div>
  );
}
