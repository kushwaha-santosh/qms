// src/components/audits/AuditStatusModal.jsx

"use client";

import { useEffect, useMemo, useState } from "react";

import { getQMSReferenceOptions } from "@/lib/api/qmsReference.api";

// ==========================================================
// HELPERS
// ==========================================================

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

const statusAlias = (value) => {
  const normalized = normalize(value);

  const aliases = {
    "UNDER INVESTIGATION": "UNDER_REVIEW",
    UNDER_INVESTIGATION: "UNDER_REVIEW",
    "UNDER REVIEW": "UNDER_REVIEW",
    "ACTION IN PROGRESS": "ACTION_IN_PROGRESS",
  };

  return aliases[normalized] || normalized;
};

const getStatusCode = (item) => {
  if (typeof item === "string") {
    return statusAlias(item);
  }

  return statusAlias(
    item?.code ||
      item?.key ||
      item?.value ||
      item?.name ||
      item?.label ||
      item?.displayName ||
      "",
  );
};

const getStatusLabel = (item) => {
  if (typeof item === "string") {
    return item
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    item?.label ||
    item?.displayName ||
    item?.name ||
    item?.code ||
    item?.key ||
    "Unknown"
  );
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  "Unable to update audit status.";

// ==========================================================
// COMPONENT
// ==========================================================

export default function AuditStatusModal({
  open,
  audit,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [options, setOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ========================================================
  // ORGANIZATION
  // ========================================================

  const organizationId =
    audit?.organizationId?._id ||
    audit?.organizationId?.id ||
    audit?.organizationId ||
    "";

  // ========================================================
  // AUDIT ID
  // ========================================================

  const auditId = audit?._id || audit?.id || "";

  // ========================================================
  // CURRENT STATUS
  // ========================================================

  const currentStatus = useMemo(() => {
    const rawStatus = statusAlias(audit?.status || "OPEN");

    const codes = options.map((item) => getStatusCode(item));

    // ------------------------------------------------------
    // Backward compatibility:
    // VERIFICATION -> PENDING_VERIFICATION
    // ------------------------------------------------------

    if (
      rawStatus === "VERIFICATION" &&
      codes.includes("PENDING_VERIFICATION") &&
      !codes.includes("VERIFICATION")
    ) {
      return "PENDING_VERIFICATION";
    }

    // ------------------------------------------------------
    // Backward compatibility:
    // UNDER_INVESTIGATION -> UNDER_REVIEW
    // ------------------------------------------------------

    if (rawStatus === "UNDER_INVESTIGATION" && codes.includes("UNDER_REVIEW")) {
      return "UNDER_REVIEW";
    }

    return rawStatus;
  }, [audit?.status, options]);

  // ========================================================
  // LOAD COMMON QMS STATUS MASTER DATA
  // ========================================================

  useEffect(() => {
    if (!open || !organizationId) {
      setOptions([]);
      return;
    }

    let cancelled = false;

    const loadStatuses = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const list = await getQMSReferenceOptions("QMS_STATUS", {
          organizationId,
          module: "AUDIT",
        });

        if (cancelled) {
          return;
        }

        setOptions(Array.isArray(list) ? list : []);
      } catch (requestError) {
        if (!cancelled) {
          setOptions([]);

          setError(
            getErrorMessage(requestError) ||
              "Unable to load Audit statuses from Master Data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [open, organizationId]);

  // ========================================================
  // RESET MODAL
  // ========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setStatus(currentStatus);

    /*
     * IMPORTANT:
     *
     * Audit stores the latest status-change comment in
     * statusComment.
     *
     * Do NOT use closureComment here.
     */
    setComment(String(audit?.statusComment || ""));

    setError("");
  }, [open, audit, currentStatus]);

  // ========================================================
  // AVAILABLE STATUSES
  // ========================================================

  const availableStatuses = useMemo(() => {
    const mapped = options
      .map((item) => ({
        raw: item,
        code: getStatusCode(item),
        label: getStatusLabel(item),
      }))
      .filter((item) => item.code);

    /*
     * Keep an existing database status visible even when
     * it has subsequently been deactivated in Master Data.
     */
    if (currentStatus && !mapped.some((item) => item.code === currentStatus)) {
      mapped.unshift({
        raw: audit?.status || currentStatus,

        code: currentStatus,

        label: getStatusLabel(audit?.status || currentStatus),

        missingFromMaster: true,
      });
    }

    return mapped.map((item) => ({
      ...item,

      isCurrent: item.code === currentStatus,
    }));
  }, [options, currentStatus, audit?.status]);

  // ========================================================
  // CHECK OTHER STATUS
  // ========================================================

  const hasOtherStatuses = useMemo(
    () =>
      availableStatuses.some(
        (item) => !item.isCurrent && !item.missingFromMaster,
      ),
    [availableStatuses],
  );

  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!auditId) {
      setError("Invalid audit ID.");
      return;
    }

    if (!status) {
      setError("Please select a status.");
      return;
    }

    if (status === currentStatus) {
      setError("Please select a different status.");
      return;
    }

    /*
     * Keep the payload explicit.
     *
     * Backend expects:
     *
     * {
     *   status: "...",
     *   comment: "..."
     * }
     */
    const payload = {
      auditId,

      status,

      comment: String(comment || "").trim(),
    };

    try {
      await onSubmit?.(payload);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  // ========================================================
  // CLOSED
  // ========================================================

  if (!open) {
    return null;
  }

  // ========================================================
  // CURRENT STATUS LABEL
  // ========================================================

  const currentStatusLabel =
    availableStatuses.find((item) => item.code === currentStatus)?.label ||
    currentStatus ||
    "OPEN";

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Change Audit Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {audit?.auditNumber || auditId || "Audit"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Current status:{" "}
                <span className="font-semibold text-slate-700">
                  {currentStatusLabel}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                STATUS
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(statusAlias(event.target.value))}
                disabled={
                  loading || loadingOptions || !availableStatuses.length
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {loadingOptions ? "Loading statuses..." : "Select status"}
                </option>

                {availableStatuses.map((item) => (
                  <option
                    key={item.code}
                    value={item.code}
                    disabled={item.isCurrent || item.missingFromMaster}
                  >
                    {item.label}

                    {item.isCurrent
                      ? " (Current)"
                      : item.missingFromMaster
                        ? " (Not active)"
                        : ""}
                  </option>
                ))}
              </select>

              {!loadingOptions && !availableStatuses.length && (
                <p className="mt-1 text-xs text-red-600">
                  No active statuses are configured in Master Data.
                </p>
              )}
            </div>

            {/* =================================================
                COMMENT
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Comment
              </label>

              <textarea
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
                placeholder="Reason or comment..."
              />

              <p className="mt-1 text-xs text-slate-400">
                This comment will be saved with the Audit status change.
              </p>
            </div>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingOptions ||
                !auditId ||
                !hasOtherStatuses ||
                !status ||
                status === currentStatus
              }
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
