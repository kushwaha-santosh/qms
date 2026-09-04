"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
  Truck,
  TrendingUp,
} from "lucide-react";

import { getReports } from "@/lib/api/reports.api";

/* ============================================================
DATE HELPERS
============================================================ */

const today = () => new Date().toISOString().slice(0, 10);

const defaultFrom = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ============================================================
KPI CONFIG
============================================================ */

const KPI_CONFIG = {
  NCR: {
    icon: ShieldAlert,
    description: "Non-conformances",
    iconClass: "bg-red-50 text-red-600",
    accentClass: "bg-red-500",
    valueClass: "text-red-700",
  },

  CAPA: {
    icon: ClipboardCheck,
    description: "Corrective actions",
    iconClass: "bg-emerald-50 text-emerald-600",
    accentClass: "bg-emerald-500",
    valueClass: "text-emerald-700",
  },

  Audits: {
    icon: CheckCircle2,
    description: "Audit records",
    iconClass: "bg-blue-50 text-blue-600",
    accentClass: "bg-blue-500",
    valueClass: "text-blue-700",
  },

  Documents: {
    icon: FileText,
    description: "Controlled documents",
    iconClass: "bg-violet-50 text-violet-600",
    accentClass: "bg-violet-500",
    valueClass: "text-violet-700",
  },

  Training: {
    icon: GraduationCap,
    description: "Training records",
    iconClass: "bg-amber-50 text-amber-600",
    accentClass: "bg-amber-500",
    valueClass: "text-amber-700",
  },

  Suppliers: {
    icon: Truck,
    description: "Supplier records",
    iconClass: "bg-cyan-50 text-cyan-600",
    accentClass: "bg-cyan-500",
    valueClass: "text-cyan-700",
  },
};

/* ============================================================
REPORT CONFIG
============================================================ */

const REPORT_CONFIG = {
  ncrStatus: {
    icon: ShieldAlert,
    iconClass: "bg-red-50 text-red-600",
    barClass: "bg-red-500",
  },

  capaStatus: {
    icon: ClipboardCheck,
    iconClass: "bg-emerald-50 text-emerald-600",
    barClass: "bg-emerald-500",
  },

  auditStatus: {
    icon: CheckCircle2,
    iconClass: "bg-blue-50 text-blue-600",
    barClass: "bg-blue-500",
  },

  ncrCategory: {
    icon: BarChart3,
    iconClass: "bg-orange-50 text-orange-600",
    barClass: "bg-orange-500",
  },

  ncrSeverity: {
    icon: TrendingUp,
    iconClass: "bg-red-50 text-red-600",
    barClass: "bg-red-500",
  },

  ncrDepartment: {
    icon: Activity,
    iconClass: "bg-indigo-50 text-indigo-600",
    barClass: "bg-indigo-500",
  },

  capaDepartment: {
    icon: ClipboardCheck,
    iconClass: "bg-emerald-50 text-emerald-600",
    barClass: "bg-emerald-500",
  },

  auditType: {
    icon: CheckCircle2,
    iconClass: "bg-blue-50 text-blue-600",
    barClass: "bg-blue-500",
  },

  documentType: {
    icon: FileText,
    iconClass: "bg-violet-50 text-violet-600",
    barClass: "bg-violet-500",
  },

  documentStatus: {
    icon: FileCheck2,
    iconClass: "bg-purple-50 text-purple-600",
    barClass: "bg-purple-500",
  },

  trainingType: {
    icon: GraduationCap,
    iconClass: "bg-amber-50 text-amber-600",
    barClass: "bg-amber-500",
  },

  supplierCategory: {
    icon: Truck,
    iconClass: "bg-cyan-50 text-cyan-600",
    barClass: "bg-cyan-500",
  },
};

/* ============================================================
KPI CARD
============================================================ */

function KPICard({ label, value }) {
  const config = KPI_CONFIG[label] || KPI_CONFIG.NCR;
  const Icon = config.icon;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${config.accentClass}`} />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p
            className={`mt-1 text-2xl font-bold leading-none tracking-tight ${config.valueClass}`}
          >
            {value ?? 0}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-500">
            {config.description}
          </p>
        </div>

        <div className={`shrink-0 rounded-lg p-2.5 ${config.iconClass}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
DISTRIBUTION LIST
============================================================ */

function DistributionList({ rows = [], barClass = "bg-blue-500" }) {
  const normalizedRows = Array.isArray(rows) ? rows : [];

  const total = normalizedRows.reduce(
    (sum, item) => sum + (Number(item?.value) || 0),
    0,
  );

  const maxValue = Math.max(
    ...normalizedRows.map((item) => Number(item?.value) || 0),
    1,
  );

  if (!normalizedRows.length) {
    return (
      <div className="flex min-h-[70px] items-center justify-center rounded-lg bg-slate-50 text-[11px] text-slate-400">
        No data for selected period.{" "}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {normalizedRows.map((row, index) => {
        const value = Number(row?.value) || 0;

        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

        const width = Math.round((value / maxValue) * 100);

        return (
          <div key={`${row?.name}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${barClass}`}
                />

                <span className="truncate text-[11px] font-medium text-slate-600">
                  {pretty(row?.name)}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[9px] font-medium text-slate-400">
                  {percentage}%
                </span>

                <span className="min-w-[22px] text-right text-[11px] font-bold text-slate-800">
                  {value}
                </span>
              </div>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                style={{
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
REPORT CARD
============================================================ */

function ReportCard({ title, description, rows, configKey }) {
  const config = REPORT_CONFIG[configKey] || REPORT_CONFIG.ncrStatus;

  const Icon = config.icon;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {" "}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        {" "}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`rounded-lg p-2 ${config.iconClass}`}>
            {" "}
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />{" "}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-slate-900">
              {title}
            </h3>

            {description && (
              <p className="mt-0.5 truncate text-[9px] text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <BarChart3 className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>
      <div className="px-4 py-3">
        <DistributionList rows={rows} barClass={config.barClass} />
      </div>
    </div>
  );
}

/* ============================================================
SECTION HEADER
============================================================ */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <div className={`rounded-lg p-1.5 ${iconClass}`}>
        {" "}
        <Icon className="h-3.5 w-3.5" />{" "}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
            {eyebrow}
          </p>

          <span className="h-1 w-1 rounded-full bg-slate-300" />

          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>

        {description && (
          <p className="mt-0.5 text-[10px] text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
DATE PRESET
============================================================ */

function QuickDateButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}{" "}
    </button>
  );
}

/* ============================================================
PAGE
============================================================ */

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePreset, setActivePreset] = useState("1Y");

  /* ============================================================
LOAD REPORT
============================================================ */

  const load = useCallback(async () => {
    if (!from || !to) return;

    if (from > to) {
      setError("The From date cannot be later than the To date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getReports({
        from,
        to,
      });

      setReport(response || null);
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

  /* ============================================================
DATA
============================================================ */

  const summary = report?.summary || {};
  const breakdowns = report?.breakdowns || {};

  const cards = useMemo(
    () => [
      ["NCR", summary.ncr],
      ["CAPA", summary.capa],
      ["Audits", summary.audits],
      ["Documents", summary.documents],
      ["Training", summary.training],
      ["Suppliers", summary.suppliers],
    ],
    [summary],
  );

  /* ============================================================
DATE PRESETS
============================================================ */

  const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();

    if (preset === "30D") {
      start.setDate(start.getDate() - 30);
    }

    if (preset === "90D") {
      start.setDate(start.getDate() - 90);
    }

    if (preset === "6M") {
      start.setMonth(start.getMonth() - 6);
    }

    if (preset === "1Y") {
      start.setFullYear(start.getFullYear() - 1);
    }

    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
    setActivePreset(preset);
  };

  /* ============================================================
EXPORT
============================================================ */

  /* ============================================================
EXPORT
============================================================ */

  const exportReport = () => {
    if (!report) return;

    const csvRows = [];

    const normalizedModule = (value) => {
      const moduleMap = {
        NCR: "NCR",
        CAPA: "CAPA",
        AUDIT: "AUDIT",
        DOCUMENT: "DOCUMENT",
        TRAINING: "TRAINING",
        SUPPLIER: "SUPPLIER",
      };

      return (
        moduleMap[String(value || "").toUpperCase()] ||
        String(value || "").toUpperCase()
      );
    };

    const breakdownConfig = {
      ncrStatus: {
        module: "NCR",
        metric: "STATUS",
      },
      capaStatus: {
        module: "CAPA",
        metric: "STATUS",
      },
      auditStatus: {
        module: "AUDIT",
        metric: "STATUS",
      },
      documentStatus: {
        module: "DOCUMENT",
        metric: "STATUS",
      },
      trainingStatus: {
        module: "TRAINING",
        metric: "STATUS",
      },
      supplierStatus: {
        module: "SUPPLIER",
        metric: "STATUS",
      },
      ncrCategory: {
        module: "NCR",
        metric: "CATEGORY",
      },
      ncrSeverity: {
        module: "NCR",
        metric: "SEVERITY",
      },
      ncrDepartment: {
        module: "NCR",
        metric: "DEPARTMENT",
      },
      capaDepartment: {
        module: "CAPA",
        metric: "DEPARTMENT",
      },
      auditType: {
        module: "AUDIT",
        metric: "TYPE",
      },
      documentType: {
        module: "DOCUMENT",
        metric: "TYPE",
      },
      trainingType: {
        module: "TRAINING",
        metric: "TYPE",
      },
      supplierCategory: {
        module: "SUPPLIER",
        metric: "CATEGORY",
      },
    };

    /* ==========================================================
  CSV HEADER
  ========================================================== */

    csvRows.push([
      "section",
      "module",
      "metric",
      "category",
      "value",
      "fromDate",
      "toDate",
    ]);

    /* ==========================================================
  SUMMARY
  ========================================================== */

    Object.entries(summary).forEach(([key, value]) => {
      csvRows.push([
        "SUMMARY",
        normalizedModule(key),
        "COUNT",
        "",
        Number(value) || 0,
        from,
        to,
      ]);
    });

    /* ==========================================================
  BREAKDOWNS
  ========================================================== */

    Object.entries(breakdowns).forEach(([section, items]) => {
      if (!Array.isArray(items)) return;

      const config = breakdownConfig[section];

      if (!config) {
        console.warn(
          `CSV export: No configuration found for breakdown "${section}".`,
        );

        return;
      }

      items.forEach((item) => {
        csvRows.push([
          "BREAKDOWN",
          config.module,
          config.metric,
          pretty(item?.name),
          Number(item?.value) || 0,
          from,
          to,
        ]);
      });
    });

    /* ==========================================================
  CSV ESCAPE
  ========================================================== */

    const escapeCsvValue = (value) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replaceAll('"', '""')}"`;
    };

    const csv = csvRows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    /* ==========================================================
  UTF-8 BOM
  ========================================================== */

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    /* ==========================================================
  DOWNLOAD
  ========================================================== */

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `qms-report-${from}-to-${to}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const periodLabel =
    report?.period?.from && report?.period?.to
      ? `${formatDate(report.period.from)} – ${formatDate(report.period.to)}`
      : `${formatDate(from)} – ${formatDate(to)}`;

  /* ============================================================
RENDER
============================================================ */

  return (
    <div className="min-h-full bg-white">
      {" "}
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 lg:px-5 lg:py-5">
        {/* ======================================================
HEADER
======================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/50 px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* TITLE */}

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-sm">
                  <BarChart3 className="h-5 w-5" strokeWidth={2} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                      QMS Reports
                    </h1>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live Data
                    </span>
                  </div>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Quality performance, compliance and operational
                    intelligence.
                  </p>
                </div>
              </div>

              {/* CONTROLS */}

              <div className="flex flex-col gap-2 xl:items-end">
                <div className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <QuickDateButton
                    active={activePreset === "30D"}
                    onClick={() => applyPreset("30D")}
                  >
                    30 Days
                  </QuickDateButton>

                  <QuickDateButton
                    active={activePreset === "90D"}
                    onClick={() => applyPreset("90D")}
                  >
                    90 Days
                  </QuickDateButton>

                  <QuickDateButton
                    active={activePreset === "6M"}
                    onClick={() => applyPreset("6M")}
                  >
                    6 Months
                  </QuickDateButton>

                  <QuickDateButton
                    active={activePreset === "1Y"}
                    onClick={() => applyPreset("1Y")}
                  >
                    1 Year
                  </QuickDateButton>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    From
                    <div className="relative mt-1">
                      <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-blue-500" />

                      <input
                        type="date"
                        value={from}
                        onChange={(e) => {
                          setFrom(e.target.value);
                          setActivePreset("");
                        }}
                        className="h-8 rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </label>

                  <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    To
                    <div className="relative mt-1">
                      <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-blue-500" />

                      <input
                        type="date"
                        value={to}
                        onChange={(e) => {
                          setTo(e.target.value);
                          setActivePreset("");
                        }}
                        className="h-8 rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={loading ? "h-3 w-3 animate-spin" : "h-3 w-3"}
                    />
                    Run Report
                  </button>

                  <button
                    type="button"
                    onClick={exportReport}
                    disabled={!report}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* INFO BAR */}

          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <CalendarDays className="h-3 w-3 text-blue-500" />

              <span>
                Reporting period:
                <span className="ml-1 font-bold text-slate-700">
                  {periodLabel}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
              <Activity className="h-3 w-3" />
              Database-driven analytics
            </div>
          </div>
        </div>

        {/* ======================================================
        ERROR
    ======================================================= */}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================
        LOADING
    ======================================================= */}

        {loading && !report ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-700">
              Loading quality report
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Collecting quality data across QMS modules...
            </p>
          </div>
        ) : (
          <>
            {/* ==================================================
            EXECUTIVE SUMMARY
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Executive Summary"
                title="Quality Management Overview"
                description="High-level activity across the organization's QMS."
                icon={BarChart3}
                iconClass="bg-blue-50 text-blue-600"
              />

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {cards.map(([label, value]) => (
                  <KPICard key={label} label={label} value={value} />
                ))}
              </div>
            </section>

            {/* ==================================================
            CORE QUALITY STATUS
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Quality Performance"
                title="Core Quality Status"
                description="Lifecycle distribution of the primary QMS quality records."
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <div className="grid gap-3 lg:grid-cols-3">
                <ReportCard
                  title="NCR Status"
                  description="Non-conformance lifecycle"
                  rows={breakdowns.ncrStatus}
                  configKey="ncrStatus"
                />

                <ReportCard
                  title="CAPA Status"
                  description="Corrective action lifecycle"
                  rows={breakdowns.capaStatus}
                  configKey="capaStatus"
                />

                <ReportCard
                  title="Audit Status"
                  description="Audit execution lifecycle"
                  rows={breakdowns.auditStatus}
                  configKey="auditStatus"
                />
              </div>
            </section>

            {/* ==================================================
            NCR ANALYSIS
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Non-Conformance Analysis"
                title="NCR Intelligence"
                description="Sources, severity and organizational impact of non-conformances."
                icon={ShieldAlert}
                iconClass="bg-red-50 text-red-600"
              />

              <div className="grid gap-3 lg:grid-cols-3">
                <ReportCard
                  title="NCR by Category"
                  description="Classification of non-conformances"
                  rows={breakdowns.ncrCategory}
                  configKey="ncrCategory"
                />

                <ReportCard
                  title="NCR by Severity"
                  description="Severity distribution"
                  rows={breakdowns.ncrSeverity}
                  configKey="ncrSeverity"
                />

                <ReportCard
                  title="NCR by Department"
                  description="Departmental distribution"
                  rows={breakdowns.ncrDepartment}
                  configKey="ncrDepartment"
                />
              </div>
            </section>

            {/* ==================================================
            CAPA + AUDITS
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Corrective Action & Assurance"
                title="Improvement & Audit Analysis"
                description="Corrective action and audit program distribution."
                icon={ClipboardCheck}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <ReportCard
                  title="CAPA by Department"
                  description="Corrective action distribution"
                  rows={breakdowns.capaDepartment}
                  configKey="capaDepartment"
                />

                <ReportCard
                  title="Audit by Type"
                  description="Audit program distribution"
                  rows={breakdowns.auditType}
                  configKey="auditType"
                />
              </div>
            </section>

            {/* ==================================================
            DOCUMENT CONTROL
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Document Control"
                title="Document Management"
                description="Controlled-document classification and lifecycle status."
                icon={FileText}
                iconClass="bg-violet-50 text-violet-600"
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <ReportCard
                  title="Document by Type"
                  description="Document classification"
                  rows={breakdowns.documentType}
                  configKey="documentType"
                />

                <ReportCard
                  title="Document Status"
                  description="Document lifecycle status"
                  rows={breakdowns.documentStatus}
                  configKey="documentStatus"
                />
              </div>
            </section>

            {/* ==================================================
            TRAINING + SUPPLIERS
        =================================================== */}

            <section>
              <SectionHeader
                eyebrow="Supporting Quality Functions"
                title="People & Supplier Analysis"
                description="Training and supplier-management activity."
                icon={GraduationCap}
                iconClass="bg-amber-50 text-amber-600"
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <ReportCard
                  title="Training by Type"
                  description="Training activity classification"
                  rows={breakdowns.trainingType}
                  configKey="trainingType"
                />

                <ReportCard
                  title="Supplier Category"
                  description="Supplier distribution"
                  rows={breakdowns.supplierCategory}
                  configKey="supplierCategory"
                />
              </div>
            </section>

            {/* ==================================================
            FOOTER
        =================================================== */}

            <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-[9px] font-medium uppercase tracking-wide text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>QMS Reporting Engine · Selected reporting period</span>

              <span>Generated {formatDate(new Date())}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
