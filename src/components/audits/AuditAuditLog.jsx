"use client";
import { useEffect, useState } from "react";
import { getAuditAuditLogs } from "@/lib/api/audits.api";
export default function AuditAuditLog({ open, audit, onClose }) {
  const [logs, setLogs] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open || !audit?._id) return;
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const r = await getAuditAuditLogs(audit._id);
        const d = r?.auditLogs || r?.logs || r?.records || [];
        if (!dead) setLogs(Array.isArray(d) ? d : []);
      } catch (e) {
        if (!dead) setError(e?.message || "Unable to load audit history.");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [open, audit]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white">
        <div className="flex justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Audit History</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div>Loading...</div>
          ) : !logs.length ? (
            <div className="rounded-xl bg-slate-50 p-12 text-center text-sm text-slate-500">
              No audit history found.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((l, i) => (
                <div key={l._id || i} className="rounded-xl border p-4">
                  <div className="flex justify-between">
                    <strong>
                      {String(l.action || "AUDIT").replaceAll("_", " ")}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {l.createdAt
                        ? new Date(l.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{l.description}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {l.userName || l.userId?.email || "System"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t bg-slate-50 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
