"use client";

import { useEffect, useState } from "react";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

export default function DocumentStatusModal({
  open,
  document,
  organizationId,
  onClose,
  onSubmit,
  saving = false,
}) {
  const [status, setStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  useEffect(() => {
    if (!open || !document) {
      setStatus("");
      setStatusComment("");
      return;
    }

    setStatus(
      document.status
        ? String(document.status).trim().toUpperCase().replace(/\s+/g, "_")
        : "",
    );

    setStatusComment(document.statusComment || "");
  }, [open, document]);

  if (!open || !document) return null;

  const change = (e) => {
    setStatus(e.target.value);
  };

  const submit = async (e) => {
    e.preventDefault();

    await onSubmit({
      status,
      statusComment,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Update Document Status</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {document.documentNumber} — {document.title}
        </p>

        <div className="mt-5 space-y-4">
          <QMSReferenceSelect
            sourceType="QMS_STATUS"
            name="status"
            label="Status"
            module="DOCUMENT"
            value={status}
            onChange={change}
            organizationId={organizationId}
            required
            disabled={saving}
          />

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Comment</span>

            <textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full rounded-xl border px-3 py-2.5"
              placeholder="Enter status comment"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border px-4 py-2.5"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !status}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-white"
          >
            {saving ? "Updating..." : "Update Status"}
          </button>
        </div>
      </form>
    </div>
  );
}
