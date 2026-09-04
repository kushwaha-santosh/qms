"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = {
  key: "",
  name: "",
  description: "",
  module: "",
  action: "",
};

export default function PermissionFormModal({
  open,
  permission,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (permission) {
      setForm({
        key: permission.key || "",
        name: permission.name || "",
        description: permission.description || "",
        module: permission.module || "",
        action: permission.action || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, permission]);

  if (!open) {
    return null;
  }

  const isEdit = Boolean(permission);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "key" || name === "action" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.key.trim()) {
      setError("Permission key is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Permission name is required.");
      return;
    }

    if (!form.module.trim()) {
      setError("Permission module is required.");
      return;
    }

    if (!form.action.trim()) {
      setError("Permission action is required.");
      return;
    }

    try {
      await onSubmit({
        key: form.key.trim().toUpperCase(),

        name: form.name.trim(),

        description: form.description.trim(),

        module: form.module.trim(),

        action: form.action.trim().toUpperCase(),
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to save permission.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Permission" : "Add Permission"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update the permission details."
                : "Create a global permission for the RBAC system."}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Permission Key
              </label>

              <input
                name="key"
                value={form.key}
                onChange={handleChange}
                disabled={isEdit || loading}
                placeholder="USER_VIEW"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black disabled:bg-gray-100"
              />

              {isEdit && (
                <p className="mt-1 text-xs text-gray-400">
                  Permission keys are immutable.
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="View Users"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Module
                </label>

                <input
                  name="module"
                  value={form.module}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Users"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Action
                </label>

                <input
                  name="action"
                  value={form.action}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="VIEW"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Allows the user to view users."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Permission"
                  : "Create Permission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
