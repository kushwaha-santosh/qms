"use client";
import { useEffect, useState } from "react";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
export default function SupplierStatusModal({
  open,
  record,
  organizationId,
  onClose,
  onSubmit,
  saving = false,
}) {
  const [status, setStatus] = useState(""),
    [statusComment, setStatusComment] = useState("");
  useEffect(() => {
    if (open && record) {
      setStatus(
        String(record.status || "")
          .trim()
          .toUpperCase(),
      );
      setStatusComment(record.statusComment || "");
    }
  }, [open, record]);
  if (!open || !record) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit({ status, statusComment });
        }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Update Supplier Status</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {record.supplierCode} — {record.name}
        </p>
        <div className="mt-5 space-y-4">
          <QMSReferenceSelect
            sourceType="QMS_STATUS"
            name="status"
            label="Status"
            module="SUPPLIERS"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            organizationId={organizationId}
            required
            disabled={saving}
          />
          <textarea
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            rows={3}
            disabled={saving}
            className="w-full rounded-xl border px-3 py-2.5"
            placeholder="Status comment"
          />
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
