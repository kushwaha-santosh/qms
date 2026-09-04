"use client";
export default function TrainingDeleteConfirmModal({
  open,
  record,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !record) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Delete Training</h2>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong>{record.trainingNumber}</strong>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-white"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
