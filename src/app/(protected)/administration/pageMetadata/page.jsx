"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createPageMetadata,
  getPageMetadata,
  updatePageMetadata,
  updatePageMetadataStatus,
  deletePageMetadata,
} from "@/lib/api/pageMetadata.api";

import { useAuth } from "@/context/AuthProvider";

import PageMetadataTable from "@/components/pageMetadata/PageMetadataTable";
import PageMetadataFormModal from "@/components/pageMetadata/PageMetadataFormModal";
import PageMetadataConfirmModal from "@/components/pageMetadata/PageMetadataConfirmModal";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.apiMessage ||
  error?.message ||
  fallback;

export default function PageMetadataPage() {
  const { user, loading: authLoading, initialized } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);

  const canManage = ["SUPER_ADMIN", "ORG_ADMIN"].includes(user?.role);

  // ==========================================================
  // LOAD PAGE METADATA
  // ==========================================================

  const loadMetadata = useCallback(async () => {
    if (!canManage) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getPageMetadata();

      setRows(response?.data?.pageMetadata || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load page metadata."));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (!authLoading && initialized) {
      loadMetadata();
    }
  }, [authLoading, initialized, loadMetadata]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      [row.key, row.path, row.title, row.description, row.keywords].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch),
      ),
    );
  }, [rows, search]);

  // ==========================================================
  // CREATE
  // ==========================================================

  const handleCreate = () => {
    if (!canManage) return;

    setSelected(null);
    setModalOpen(true);
    setError("");
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (row) => {
    if (!canManage) return;

    setSelected(row);
    setModalOpen(true);
    setError("");
  };

  // ==========================================================
  // CLOSE FORM MODAL
  // ==========================================================

  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);
    setSelected(null);
  };

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError("");

      if (selected?.key) {
        await updatePageMetadata(selected.key, payload);
      } else {
        await createPageMetadata(payload);
      }

      setModalOpen(false);
      setSelected(null);

      await loadMetadata();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save page metadata."));

      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // STATUS CHANGE
  // ==========================================================

  const handleStatusChange = (row, nextActive) => {
    if (!canManage || !row?.key) {
      return;
    }

    if ((row.isActive !== false) === nextActive) {
      return;
    }

    setStatusTarget({
      row,
      nextActive,
    });

    setStatusConfirmOpen(true);
    setError("");
  };

  // ==========================================================
  // CLOSE STATUS CONFIRM
  // ==========================================================

  const closeStatusConfirm = () => {
    if (statusSaving) {
      return;
    }

    setStatusConfirmOpen(false);
    setStatusTarget(null);
  };

  // ==========================================================
  // CONFIRM STATUS CHANGE
  // ==========================================================

  const confirmStatusChange = async () => {
    if (!statusTarget?.row?.key) {
      return;
    }

    try {
      setStatusSaving(true);
      setError("");

      await updatePageMetadataStatus(
        statusTarget.row.key,
        statusTarget.nextActive,
      );

      setStatusConfirmOpen(false);
      setStatusTarget(null);

      await loadMetadata();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to update page metadata status."),
      );
    } finally {
      setStatusSaving(false);
    }
  };

  // ==========================================================
  // DELETE PAGE METADATA
  // ==========================================================

  const handleDelete = async (row) => {
    if (!canManage) {
      throw new Error("You do not have permission to delete page metadata.");
    }

    if (!row?.key) {
      throw new Error("Page metadata key is required.");
    }

    if (row.source !== "DATABASE") {
      throw new Error("Default page metadata cannot be deleted.");
    }

    try {
      setError("");

      await deletePageMetadata(row.key);

      await loadMetadata();
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Unable to delete page metadata.",
      );

      setError(message);

      throw requestError;
    }
  };

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading || !initialized) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!canManage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-semibold text-red-800">Access Denied</h1>

          <p className="mt-2 text-sm text-red-700">
            You do not have permission to access Page Metadata Management.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Page Metadata
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage page titles, descriptions, keywords and metadata status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadMetadata}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Create Page Metadata
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* SEARCH */}

      <div className="rounded-lg border bg-white p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by key, path, title or description..."
          className="w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
      </div>

      {/* TABLE */}

      <PageMetadataTable
        rows={filteredRows}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* CREATE / EDIT MODAL */}

      <PageMetadataFormModal
        open={modalOpen}
        pageMetadata={selected}
        loading={saving}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* STATUS CONFIRM MODAL */}

      <PageMetadataConfirmModal
        open={statusConfirmOpen}
        pageMetadata={statusTarget?.row}
        nextStatus={statusTarget?.nextActive}
        loading={statusSaving}
        onClose={closeStatusConfirm}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
