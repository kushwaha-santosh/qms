"use client";

export default function PermissionConfirmModal({
  open,
  permission,
  action = "delete",
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const isDelete =
    action === "delete";

  const isActivate =
    action === "activate";

  const title = isDelete
    ? "Delete Permission"
    : isActivate
    ? "Activate Permission"
    : "Deactivate Permission";

  const confirmText =
    isDelete
      ? "Delete Permission"
      : isActivate
      ? "Activate Permission"
      : "Deactivate Permission";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isActivate
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <svg
                className={`h-6 w-6 ${
                  isActivate
                    ? "text-green-600"
                    : "text-red-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isDelete ? (
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M5 13l4 4L19 7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {title}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isDelete
                  ? "This action cannot be undone."
                  : isActivate
                  ? "This permission will become available for role assignment."
                  : "Inactive permissions cannot be assigned to roles."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-600">
            Are you sure you want to{" "}
            {isDelete
              ? "delete"
              : isActivate
              ? "activate"
              : "deactivate"}{" "}
            <span className="font-semibold text-gray-900">
              {permission?.name ||
                permission?.key ||
                "this permission"}
            </span>
            ?
          </p>

          {permission?.key && (
            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-400">
                Permission key
              </div>

              <div className="mt-0.5 font-mono text-sm font-medium text-gray-700">
                {permission.key}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={loading}
            className={`min-w-[150px] rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
              isActivate
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading
              ? "Processing..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}