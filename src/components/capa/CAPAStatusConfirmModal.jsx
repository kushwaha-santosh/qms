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

export default function CAPAStatusConfirmModal({
  open,
  capa,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [options, setOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const organizationId =
    capa?.organizationId?._id || capa?.organizationId || "";

  /*
   * Resolve the actual current CAPA status against the active
   * QMS_STATUS master-data options.
   */
  const currentStatus = useMemo(() => {
    const raw = statusAlias(capa?.status);

    const codes = options.map((item) => statusAlias(item.code || item.name));

    // Backward compatibility:
    // VERIFICATION -> PENDING_VERIFICATION
    if (
      raw === "VERIFICATION" &&
      codes.includes("PENDING_VERIFICATION") &&
      !codes.includes("VERIFICATION")
    ) {
      return "PENDING_VERIFICATION";
    }

    // Backward compatibility:
    // UNDER_INVESTIGATION -> UNDER_REVIEW
    if (raw === "UNDER_INVESTIGATION" && codes.includes("UNDER_REVIEW")) {
      return "UNDER_REVIEW";
    }

    return raw;
  }, [options, capa?.status]);

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
          module: "CAPA",
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
              "Unable to load CAPA statuses from Master Data.",
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
   * The current status remains selected and is disabled.
   * This prevents the browser from automatically selecting
   * the first option when the current status is not in the list.
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
   * When the modal opens, select the actual current CAPA status.
   */
  useEffect(() => {
    if (!open) return;

    setStatus(statusAlias(currentStatus));
    setComments(capa?.comments || "");
    setError("");
  }, [open, capa, currentStatus]);

  if (!open) return null;

  const hasOtherStatuses = availableStatuses.some((item) => !item.isCurrent);

  const submit = async (event) => {
    event.preventDefault();

    /*
     * Prevent submitting the same status.
     */
    if (!status) {
      setError(
        hasOtherStatuses
          ? "Please select a status."
          : "No other active status is available for this CAPA.",
      );
      return;
    }

    if (status === currentStatus) {
      setError("Please select a different status.");
      return;
    }

    try {
      setError("");

      await onConfirm({
        status,
        comments,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update CAPA status.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Change CAPA Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {capa?.capaNumber || "CAPA"}
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

        <form onSubmit={submit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading || !availableStatuses.length}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
                <option value="">No active CAPA statuses available</option>
              )}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Current status:{" "}
              <span className="font-medium text-slate-700">
                {currentStatus || "Unknown"}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Comments
            </label>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Enter status change comments..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !hasOtherStatuses}
              className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
