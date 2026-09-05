"use client";

import { DataTable } from "@/components/common/data-table";

export default function AuditLogTable({
  auditLogs = [],
  loading = false,
  onViewDetails,
}) {
  return (
    <DataTable minWidth="min-w-[1000px]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Loading audit logs...</td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No audit logs found.</td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{log.userName || "System"}</div>
                    {log.userEmail && <div className="text-xs text-slate-500">{log.userEmail}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{log.module}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{log.action}</span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-sm text-slate-700">{log.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.organizationId?.name || "Global"}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onViewDetails?.(log)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </DataTable>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
