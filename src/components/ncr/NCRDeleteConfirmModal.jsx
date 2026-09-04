"use client";

export default function NCRDeleteConfirmModal({
  open,
  ncr,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  const number = ncr?.ncrNumber || ncr?.number || "this NCR";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>
          <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">
            Delete NCR?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Are you sure you want to delete{" "}
            <strong className="text-slate-700">{number}</strong>? This action
            cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete NCR"}
          </button>
        </div>
      </div>
    </div>
  );
}
