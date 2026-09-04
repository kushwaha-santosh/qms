"use client";

import { useEffect, useState } from "react";

export default function ProductDeleteModal({
  open,
  product = null,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
    }
  }, [open, product]);

  if (!open || !product) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      await onConfirm();
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to delete product.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Confirm Delete
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {product.code || product._id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-sm leading-6 text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-900">
                {product.name}
              </span>
              ?
            </p>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              This action permanently removes the product master record and will
              be recorded in the audit log. Do not delete a product that is
              already being referenced by NCR or CAPA records.
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Delete Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
