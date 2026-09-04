"use client";

import { useState } from "react";

export default function PageMetadataTable({
  rows = [],
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================================
  // OPEN DELETE CONFIRMATION
  // ==========================================================

  const handleDeleteClick = (row) => {
    if (!row || row.source !== "DATABASE") {
      return;
    }

    if (typeof onDelete !== "function") {
      console.error("PageMetadataTable: onDelete handler is not provided.");

      return;
    }

    setDeleteRow(row);
  };

  // ==========================================================
  // CLOSE DELETE MODAL
  // ==========================================================

  const handleCloseDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteRow(null);
  };

  // ==========================================================
  // CONFIRM DELETE
  // ==========================================================

  const handleConfirmDelete = async () => {
    if (
      !deleteRow ||
      deleteRow.source !== "DATABASE" ||
      typeof onDelete !== "function" ||
      deleting
    ) {
      return;
    }

    try {
      setDeleting(true);

      await onDelete(deleteRow);

      setDeleteRow(null);
    } catch (error) {
      console.error("Unable to delete page metadata:", error);

      // Keep confirmation modal open when deletion fails.
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        Loading page metadata...
      </div>
    );
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (!rows.length) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
        No page metadata found.
      </div>
    );
  }

  // ==========================================================
  // TABLE
  // ==========================================================

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Page
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Source
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const isActive = row.isActive !== false;
                const isDatabaseMetadata = row.source === "DATABASE";

                return (
                  <tr key={row._id || row.key} className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-gray-900">{row.key}</div>

                      <div className="mt-1 text-xs text-gray-500">
                        {row.path}
                      </div>
                    </td>

                    <td className="max-w-xs px-4 py-4 align-top text-sm text-gray-700">
                      {row.title || "—"}
                    </td>

                    <td className="max-w-sm px-4 py-4 align-top text-sm text-gray-600">
                      <div className="line-clamp-3">
                        {row.description || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isDatabaseMetadata
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isDatabaseMetadata ? "Database" : "Default"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <select
                        value={isActive ? "ACTIVE" : "INACTIVE"}
                        onChange={(event) =>
                          onStatusChange?.(row, event.target.value === "ACTIVE")
                        }
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-gray-200 ${
                          isActive
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                        aria-label={`Change status for ${row.key}`}
                      >
                        <option value="ACTIVE">ACTIVE</option>

                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() => onEdit?.(row)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        {/* DELETE */}

                        {isDatabaseMetadata ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(row)}
                            disabled={deleting}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}

      {deleteRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-page-metadata-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2
                    id="delete-page-metadata-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Delete Page Metadata
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the page metadata for:
              </p>

              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">
                  {deleteRow.key}
                </div>

                {deleteRow.path ? (
                  <div className="mt-1 text-sm text-gray-500">
                    {deleteRow.path}
                  </div>
                ) : null}

                {deleteRow.title ? (
                  <div className="mt-2 text-sm text-gray-700">
                    {deleteRow.title}
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                The database record will be permanently removed. If this page
                has default metadata, the application default will be used
                again.
              </p>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Metadata"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
