"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_LABELS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export default function ProductStatusModal({
  open,
  product,
  loading = false,
  onClose,
  onConfirm,
}) {
  const currentStatus = Boolean(product?.isActive) ? "ACTIVE" : "INACTIVE";
  const formatStatus = (status) =>
    String(status || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const nextStatus = useMemo(
    () => (currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
    [currentStatus],
  );

  const [status, setStatus] = useState(nextStatus);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setStatus(nextStatus);

    setComment("");

    setError("");
  }, [open, nextStatus, product]);

  if (!open) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (!status) {
      setError("Please select a product status.");

      return;
    }

    if (status === currentStatus) {
      setError(
        "The selected status is the same as the current product status.",
      );

      return;
    }

    try {
      await onConfirm({
        isActive: status === "ACTIVE",
        comment: comment.trim(),
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to update product status.",
      );
    }
  };

  const productName =
    product?.name ||
    product?.productName ||
    product?.code ||
    product?._id ||
    "Product";

  const productCode = product?.code || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Change Product Status
            </h2>

            {/* <p className="mt-1 text-xs text-slate-500">
              {productCode ? `${productCode} — ${productName}` : productName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current:{" "}
              <span className="font-medium text-slate-700">
                {STATUS_LABELS[currentStatus]}
              </span>
            </p> */}
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

        {/* FORM */}

        <form onSubmit={submit}>
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* PRODUCT */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Product
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <div className="font-medium text-slate-900">{productName}</div>

                {productCode && (
                  <div className="mt-1 text-xs text-slate-500">
                    Code: {productCode}
                  </div>
                )}
              </div>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Status {formatStatus(nextStatus)}
              </label>

              {/* <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100"
              >
                <option value="ACTIVE">Active</option>

                <option value="INACTIVE">Inactive</option>
              </select> */}

              <p className="text-sm leading-6 text-gray-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold text-gray-900">
                  {productName}
                </span>{" "}
                from{" "}
                <span className="font-semibold text-gray-900">
                  {formatStatus(currentStatus)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {formatStatus(nextStatus)}
                </span>
                ?
              </p>

              {/* <p className="mt-1 text-xs text-slate-500">
                The product will be{" "}
                <span className="font-medium">
                  {STATUS_LABELS[nextStatus].toLowerCase()}
                </span>{" "}
                after confirmation.
              </p> */}
            </div>

            {/* COMMENT */}

            {/* AUDIT INFORMATION */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs leading-5 text-slate-500">
                This status change will be recorded in the QMS audit log with
                the current user, product, previous status, new status, and
                timestamp.
              </p>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
