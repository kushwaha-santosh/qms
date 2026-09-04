"use client";

import { useEffect, useState } from "react";

export default function CAPADeleteConfirmModal({
  open,
  capa,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
    }
  }, [open]);

  if (!open || !capa) {
    return null;
  }

  const handleDelete = async () => {
    setError("");

    try {
      await onConfirm();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          "Unable to delete CAPA.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Delete CAPA</h2>

          <p className="mt-1 text-sm text-slate-500">{capa.capaNumber}</p>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-700">
            Are you sure you want to delete this CAPA? This action cannot be
            undone.
          </p>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete CAPA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
