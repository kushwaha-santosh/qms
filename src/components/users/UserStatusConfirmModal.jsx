"use client";

export default function UserStatusConfirmModal({
  open,
  user,
  nextStatus,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open || !user) {
    return null;
  }

  const getUserName = () => {
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return name || user?.email || "this user";
  };

  const currentStatus = user?.status || "ACTIVE";

  const formatStatus = (status) =>
    String(status || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const isActivating = nextStatus === "ACTIVE";
  const isSuspending = nextStatus === "SUSPENDED";

  const title = isActivating
    ? "Activate User"
    : isSuspending
      ? "Suspend User"
      : "Deactivate User";

  const actionLabel = isActivating
    ? "Activate User"
    : isSuspending
      ? "Suspend User"
      : "Deactivate User";

  const description = isActivating
    ? "This user will regain access to the application."
    : isSuspending
      ? "This user will be suspended and will not be able to access the application."
      : "This user will become inactive and will not be able to access the application.";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-status-confirm-title"
    >
      {" "}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {" "}
        <div className="border-b border-gray-200 px-6 py-5">
          {" "}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isActivating ? "bg-green-100" : "bg-orange-100"
              }`}
            >
              <svg
                className={`h-6 w-6 ${
                  isActivating ? "text-green-600" : "text-orange-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {" "}
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L2.82 17a2 2 0 001.74 3h14.88a2 2 0 001.74-3L13.71 3.86a2 2 0 00-3.42 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />{" "}
              </svg>{" "}
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="user-status-confirm-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Please confirm this status change.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-600">
            Are you sure you want to change the status of{" "}
            <span className="font-semibold text-gray-900">{getUserName()}</span>{" "}
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

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Current Status
              </span>

              <span className="text-sm font-semibold text-gray-700">
                {formatStatus(currentStatus)}
              </span>
            </div>

            <div className="my-2 border-t border-gray-200" />

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                New Status
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isActivating
                    ? "bg-green-100 text-green-700"
                    : isSuspending
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                {formatStatus(nextStatus)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex min-w-[130px] items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isActivating
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Updating...
              </>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
