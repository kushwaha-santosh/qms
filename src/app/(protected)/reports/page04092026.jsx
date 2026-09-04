"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { getReports } from "@/lib/api/reports.api";

const today = () => new Date().toISOString().slice(0, 10);
const defaultFrom = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};
const pretty = (v) =>
  String(v || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
function Section({ title, rows }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows?.length ? (
          rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-slate-600">{pretty(r.name)}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                {r.value}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No data for selected period.</p>
        )}
      </div>
    </div>
  );
}
export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await getReports({ from, to });
      setReport(r || null);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);
  useEffect(() => {
    load();
  }, []);
  const summary = report?.summary || {};
  const b = report?.breakdowns || {};
  const exportReport = () => {
    if (!report) return;
    const lines = [
      ["QMS Report", "Value"],
      ...[Object.entries(summary).map(([k, v]) => [k, v])],
    ];
    const csv = lines
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qms-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const cards = [
    ["NCR", summary.ncr],
    ["CAPA", summary.capa],
    ["Audits", summary.audits],
    ["Documents", summary.documents],
    ["Training", summary.training],
    ["Suppliers", summary.suppliers],
  ];
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              QMS Reports
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Live Data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Cross-module quality reporting from the QMS database.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-xl border px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-xl border px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            <RefreshCw
              className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Run Report
          </button>
          <button
            onClick={exportReport}
            disabled={!report}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && !report ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
          Loading report...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {cards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {value ?? 0}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BarChart3 className="h-4 w-4" />
            Reporting period: {report?.period?.from?.slice(0, 10)} to{" "}
            {report?.period?.to?.slice(0, 10)}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Section title="NCR Status" rows={b.ncrStatus} />
            <Section title="CAPA Status" rows={b.capaStatus} />
            <Section title="Audit Status" rows={b.auditStatus} />
            <Section title="NCR by Category" rows={b.ncrCategory} />
            <Section title="NCR by Severity" rows={b.ncrSeverity} />
            <Section title="NCR by Department" rows={b.ncrDepartment} />
            <Section title="CAPA by Department" rows={b.capaDepartment} />
            <Section title="Audit by Type" rows={b.auditType} />
            <Section title="Document by Type" rows={b.documentType} />
            <Section title="Document Status" rows={b.documentStatus} />
            <Section title="Training by Type" rows={b.trainingType} />
            <Section title="Supplier Category" rows={b.supplierCategory} />
          </div>
        </>
      )}
    </div>
  );
}
