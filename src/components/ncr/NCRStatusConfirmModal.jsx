"use client";

import { useEffect, useMemo, useState } from "react";
import { getQMSReferenceOptions } from "@/lib/api/qmsReference.api";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

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

const labelFor = (item) =>
  item?.name || item?.label || item?.code || "Unnamed status";

export default function NCRStatusModal({
  open,
  ncr,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [options, setOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const organizationId = ncr?.organizationId?._id || ncr?.organizationId || "";

  /*
   * Resolve the actual current NCR status against
   * the active QMS_STATUS Master Data options.
   */
  const currentStatus = useMemo(() => {
    const raw = statusAlias(ncr?.status);

    const codes = options.map((item) => statusAlias(item.code || item.name));

    /*
     * Backward compatibility:
     * VERIFICATION -> PENDING_VERIFICATION
     */
    if (
      raw === "VERIFICATION" &&
      codes.includes("PENDING_VERIFICATION") &&
      !codes.includes("VERIFICATION")
    ) {
      return "PENDING_VERIFICATION";
    }

    /*
     * Backward compatibility:
     * UNDER_INVESTIGATION -> UNDER_REVIEW
     */
    if (raw === "UNDER_INVESTIGATION" && codes.includes("UNDER_REVIEW")) {
      return "UNDER_REVIEW";
    }

    return raw;
  }, [options, ncr?.status]);

  /*
   * Load active QMS statuses from Master Data.
   */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadStatuses = async () => {
      try {
        setError("");

        const list = await getQMSReferenceOptions("QMS_STATUS", {
          organizationId,
          module: "NCR",
        });

        if (!cancelled) {
          setOptions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          setOptions([]);

          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load NCR statuses from Master Data.",
          );
        }
      }
    };

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [open, organizationId]);

  /*
   * Keep ALL active statuses in the dropdown.
   *
   * The actual current status is retained in the options
   * and marked as current/disabled.
   */
  const availableStatuses = useMemo(() => {
    const current = statusAlias(currentStatus);

    return options.map((item) => {
      const code = statusAlias(item.code || item.name);

      return {
        ...item,
        code,
        isCurrent: code === current,
      };
    });
  }, [options, currentStatus]);

  /*
   * Initialize the modal with the ACTUAL current NCR status.
   *
   * Do not select availableStatuses[0].
   */
  useEffect(() => {
    if (!open) return;

    setStatus(statusAlias(currentStatus));
    setComment(ncr?.closureComment || "");
    setError("");
  }, [open, ncr, currentStatus]);

  /*
   * Determine whether there is at least one status other
   * than the current status.
   */
  const hasOtherStatuses = useMemo(
    () => availableStatuses.some((item) => !item.isCurrent),
    [availableStatuses],
  );

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();

    if (!status) {
      setError(
        hasOtherStatuses
          ? "Please select a status."
          : "No other active status is available for this NCR.",
      );
      return;
    }

    /*
     * Prevent submitting the same status.
     */
    if (status === currentStatus) {
      setError("Please select a different status.");
      return;
    }

    try {
      setError("");

      await onSubmit({
        status,
        comment: comment.trim(),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update NCR status.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Change NCR Status
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {ncr?.ncrNumber || ncr?._id}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current:{" "}
              <span className="font-medium text-slate-700">
                {options.find(
                  (item) =>
                    statusAlias(item.code || item.name) === currentStatus,
                )?.name ||
                  currentStatus ||
                  "—"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading || !availableStatuses.length}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              >
                {availableStatuses.length ? (
                  availableStatuses.map((item) => {
                    const code = statusAlias(item.code || item.name);

                    return (
                      <option key={code} value={code} disabled={item.isCurrent}>
                        {labelFor(item)}
                        {item.isCurrent ? " (Current)" : ""}
                      </option>
                    );
                  })
                ) : (
                  <option value="">No active NCR statuses available</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Comment
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                placeholder="Add a reason or comment..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border bg-white px-4 py-2.5 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !hasOtherStatuses}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
