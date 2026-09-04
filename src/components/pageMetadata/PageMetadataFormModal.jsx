"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = {
  key: "",
  path: "",
  title: "",
  description: "",
  keywords: "",
};

export default function PageMetadataFormModal({
  open,
  pageMetadata,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const isEdit = Boolean(pageMetadata);

  useEffect(() => {
    if (!open) return;

    setError("");
    setForm({
      key: pageMetadata?.key || "",
      path: pageMetadata?.path || "",
      title: pageMetadata?.title || "",
      description: pageMetadata?.description || "",
      keywords: pageMetadata?.keywords || "",
    });
  }, [open, pageMetadata]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.key.trim()) {
      setError("Page key is required.");
      return;
    }

    if (!form.path.trim()) {
      setError("Page path is required.");
      return;
    }

    if (!form.title.trim()) {
      setError("Page title is required.");
      return;
    }

    try {
      await onSubmit({
        key: form.key.trim(),
        path: form.path.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        keywords: form.keywords.trim(),
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save page metadata.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Page Metadata" : "Create Page Metadata"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure SEO metadata for this application page.
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
          <div className="space-y-4 px-6 py-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Page Key
                </span>
                <input
                  name="key"
                  value={form.key}
                  onChange={handleChange}
                  disabled={isEdit || loading}
                  placeholder="quality-dashboard"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Path
                </span>
                <input
                  name="path"
                  value={form.path}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="/quality-dashboard"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={200}
                disabled={loading}
                placeholder="Quality Dashboard | QMS AI"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
              />
              <span className="mt-1 block text-right text-xs text-gray-400">
                {form.title.length}/200
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={500}
                rows={4}
                disabled={loading}
                placeholder="Page description for search engines."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
              />
              <span className="mt-1 block text-right text-xs text-gray-400">
                {form.description.length}/500
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Keywords
              </span>
              <textarea
                name="keywords"
                value={form.keywords}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                disabled={loading}
                placeholder="QMS, quality management, compliance"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
              />
              <span className="mt-1 block text-right text-xs text-gray-400">
                {form.keywords.length}/500
              </span>
            </label>

            <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Status is managed separately from this form using the Status
              dropdown and confirmation dialog.
            </div>
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
              type="submit"
              disabled={loading}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Metadata"
                  : "Create Metadata"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
