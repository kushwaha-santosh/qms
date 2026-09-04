"use client";

import { useEffect, useState } from "react";

const getUserName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return name || user?.name || user?.fullName || user?.email || "Unnamed User";
};

const formatRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function CAPAAssignModal({
  open,
  capa,
  users = [],
  loading = false,
  onClose,
  onConfirm,
}) {
  const [assignedTo, setAssignedTo] = useState("");

  const [error, setError] = useState("");

  const userList = Array.isArray(users) ? users : [];

  useEffect(() => {
    if (!open) {
      return;
    }

    setAssignedTo(capa?.assignedTo?._id || capa?.assignedTo || "");

    setError("");
  }, [open, capa]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!assignedTo) {
      setError("Please select a user.");
      return;
    }

    setError("");

    try {
      await onConfirm(assignedTo);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to assign CAPA.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Assign CAPA
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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assign To
            </label>

            <select
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select user</option>

              {userList.map((user) => (
                <option key={user._id} value={user._id}>
                  {getUserName(user)}
                  {user.role ? ` (${formatRole(user.role)})` : ""}
                </option>
              ))}
            </select>

            {userList.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No active users available.
              </p>
            )}
          </div>

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
              type="submit"
              disabled={loading || !assignedTo}
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign CAPA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
