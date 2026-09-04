"use client";

export default function PageMetadataConfirmModal({
  open,
  pageMetadata,
  nextStatus,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !pageMetadata) return null;

  const nextLabel = nextStatus ? "ACTIVE" : "INACTIVE";
  const currentLabel = pageMetadata.isActive !== false ? "ACTIVE" : "INACTIVE";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Confirm Status Change
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Please confirm the page metadata status change.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-900">
              {pageMetadata.title || pageMetadata.key}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {pageMetadata.path}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
              {currentLabel}
            </span>
            <span className="text-gray-400">→</span>
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                nextStatus
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {nextLabel}
            </span>
          </div>

          <p className="text-center text-sm text-gray-600">
            Are you sure you want to change this page metadata to {nextLabel}?
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : `Confirm ${nextLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
