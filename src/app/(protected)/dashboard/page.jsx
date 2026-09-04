"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { getDashboard } from "@/lib/api/dashboard.api";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ==========================================================
// EMPTY DASHBOARD
// ==========================================================

const EMPTY_DASHBOARD = {
  stats: [],
  trendData: [],
  performanceData: [],
  ncrCategoryData: [],
  capaStatusData: [],
  recentActivities: [],
  analytics: {},
  compliance: {},
  auditReadiness: {},
  overdue: {},
  kpis: {},
};

// ==========================================================
// COLORS
// ==========================================================

const ncrColors = [
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
];

const capaColors = [
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#06b6d4",
];

// ==========================================================
// DATE HELPERS
// ==========================================================

const formatInputDate = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ==========================================================
// DEFAULT RANGE
// ==========================================================

const getDefaultRange = () => {
  const end = new Date();

  const start = new Date(end);

  start.setDate(1);

  start.setMonth(start.getMonth() - 5);

  return {
    startDate: formatInputDate(start),
    endDate: formatInputDate(end),
  };
};

// ==========================================================
// DISPLAY DATE
// ==========================================================

const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================================
// CUSTOM TOOLTIP
// ==========================================================

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-xl">
      <p className="mb-1.5 text-[11px] font-semibold text-gray-500">{label}</p>

      {payload.map((item) => (
        <div
          key={item.dataKey}
          className="flex items-center justify-between gap-5 text-xs"
        >
          <span className="text-gray-600">{item.name}</span>

          <span className="font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ==========================================================
// DASHBOARD
// ==========================================================

export default function DashboardPage() {
  const router = useRouter();

  const initialRange = useMemo(() => getDefaultRange(), []);

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const [dateRange, setDateRange] = useState(initialRange);

  const [draftRange, setDraftRange] = useState(initialRange);

  const dateFilterRef = useRef(null);

  // ========================================================
  // LOAD DASHBOARD
  // ========================================================

  const loadDashboard = useCallback(async (range) => {
    if (!range?.startDate || !range?.endDate) {
      return;
    }

    setLoading(true);
    setError("");

    // Clear previous range data immediately.
    setDashboard(EMPTY_DASHBOARD);

    try {
      console.log("Loading dashboard for:", {
        startDate: range.startDate,
        endDate: range.endDate,
      });

      const response = await getDashboard({
        startDate: range.startDate,
        endDate: range.endDate,
      });

      const normalizedResponse = response || {};

      console.log("Dashboard response:", normalizedResponse);

      setDashboard({
        ...EMPTY_DASHBOARD,
        ...normalizedResponse,

        recentActivities: Array.isArray(normalizedResponse.recentActivities)
          ? normalizedResponse.recentActivities
          : Array.isArray(normalizedResponse.recentActivity)
            ? normalizedResponse.recentActivity
            : [],
      });
    } catch (e) {
      console.error("Dashboard loading error:", e);

      setDashboard(EMPTY_DASHBOARD);

      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================================
  // INITIAL LOAD / DATE CHANGE
  // ========================================================

  useEffect(() => {
    loadDashboard({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, [dateRange.startDate, dateRange.endDate, loadDashboard]);

  // ========================================================
  // CLOSE DATE FILTER
  // ========================================================

  useEffect(() => {
    const handleClick = (event) => {
      if (
        dateFilterRef.current &&
        !dateFilterRef.current.contains(event.target)
      ) {
        setDateFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // ========================================================
  // KPI DATA
  // ========================================================

  const stats = Array.isArray(dashboard.stats)
    ? dashboard.stats.map((item, index) => ({
        ...item,

        icon:
          [ShieldAlert, Target, ClipboardCheck, FileText][index] || Activity,

        iconClass:
          [
            "bg-red-50 text-red-600",
            "bg-amber-50 text-amber-600",
            "bg-blue-50 text-blue-600",
            "bg-emerald-50 text-emerald-600",
          ][index] || "bg-slate-50 text-slate-600",
      }))
    : [];

  // ========================================================
  // CHART DATA
  // ========================================================

  const trendData = Array.isArray(dashboard.trendData)
    ? dashboard.trendData
    : Array.isArray(dashboard.trend)
      ? dashboard.trend
      : [];

  const performanceData = Array.isArray(dashboard.performanceData)
    ? dashboard.performanceData
    : [];

  const ncrCategoryData = Array.isArray(dashboard.ncrCategoryData)
    ? dashboard.ncrCategoryData
    : [];

  const capaStatusData = Array.isArray(dashboard.capaStatusData)
    ? dashboard.capaStatusData
    : [];

  // ========================================================
  // RECENT ACTIVITY
  // ========================================================

  const recentActivitySource = Array.isArray(dashboard.recentActivities)
    ? dashboard.recentActivities
    : Array.isArray(dashboard.recentActivity)
      ? dashboard.recentActivity
      : [];

  const recentActivities = recentActivitySource.map((item) => {
    const module = String(item.module || "").toUpperCase();

    return {
      ...item,

      icon:
        module === "NCR"
          ? ShieldAlert
          : module === "CAPA"
            ? Target
            : module === "AUDIT" || module === "AUDITS"
              ? ClipboardCheck
              : module === "DOCUMENT" || module === "DOCUMENTS"
                ? FileText
                : Activity,

      iconClass:
        module === "NCR"
          ? "bg-red-50 text-red-600"
          : module === "CAPA"
            ? "bg-amber-50 text-amber-600"
            : module === "AUDIT" || module === "AUDITS"
              ? "bg-blue-50 text-blue-600"
              : module === "DOCUMENT" || module === "DOCUMENTS"
                ? "bg-violet-50 text-violet-600"
                : "bg-slate-50 text-slate-600",
    };
  });

  // ========================================================
  // ANALYTICS
  // ========================================================

  const analytics = dashboard.analytics || {};

  const ncrAnalytics = analytics.ncr || {};

  const capaAnalytics = analytics.capa || {};

  const auditAnalytics = analytics.audits || {};

  const documentAnalytics = analytics.documents || {};

  const overdue = analytics.overdue || dashboard.overdue || {};

  const compliance = dashboard.compliance || {};

  const auditReadiness = dashboard.auditReadiness || {};

  // ========================================================
  // DATE PRESETS
  // ========================================================

  const applyPreset = (months) => {
    const end = new Date();

    const start = new Date(end);

    start.setDate(1);

    start.setMonth(start.getMonth() - (months - 1));

    setDraftRange({
      startDate: formatInputDate(start),
      endDate: formatInputDate(end),
    });
  };

  // ========================================================
  // APPLY DATE RANGE
  // ========================================================

  const applyDateRange = () => {
    if (!draftRange.startDate || !draftRange.endDate) {
      return;
    }

    if (draftRange.startDate > draftRange.endDate) {
      setError("Start date cannot be later than end date.");

      return;
    }

    setError("");

    setDateRange({
      ...draftRange,
    });

    setDateFilterOpen(false);
  };

  // ========================================================
  // RESET DATE RANGE
  // ========================================================

  const resetDateRange = () => {
    const range = getDefaultRange();

    setDraftRange(range);

    setDateRange(range);

    setDateFilterOpen(false);
  };

  // ========================================================
  // NAVIGATION
  // ========================================================

  const handleActivityClick = (activity) => {
    const module = String(
      activity?.module || activity?.type || "",
    ).toUpperCase();

    if (module === "NCR") {
      router.push("/ncr");
      return;
    }

    if (module === "CAPA") {
      router.push("/capa");
      return;
    }

    if (module === "AUDIT" || module === "AUDITS") {
      router.push("/audits");
      return;
    }

    if (module === "DOCUMENT" || module === "DOCUMENTS") {
      router.push("/documents");
      return;
    }

    router.push("/administration/auditLogs");
  };

  const handleViewAllActivity = () => {
    router.push("/administration/auditLogs");
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-2.5 pb-2">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Dashboard
            </h1>

            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Live Overview
            </span>
          </div>

          <p className="mt-0.5 text-xs text-gray-500">
            Overview of your quality management activities and performance.
          </p>
        </div>

        {/* HEADER ACTIONS */}

        <div className="flex items-center gap-2">
          {/* DATE FILTER */}

          <div ref={dateFilterRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setDraftRange(dateRange);

                setDateFilterOpen((value) => !value);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <CalendarDays className="h-3.5 w-3.5 text-gray-500" />

              <span>
                {formatDisplayDate(dateRange.startDate)}
                {" - "}
                {formatDisplayDate(dateRange.endDate)}
              </span>
            </button>

            {dateFilterOpen && (
              <div className="absolute right-0 top-10 z-50 w-[310px] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      Dashboard Date Range
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-500">
                      Select the period for historical analytics.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDateFilterOpen(false)}
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset(3)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Last 3 Months
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(6)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Last 6 Months
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(12)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Last 12 Months
                  </button>
                </div>

                <div className="my-3 border-t border-gray-100" />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-500">
                      From
                    </label>

                    <input
                      type="date"
                      value={draftRange.startDate}
                      max={draftRange.endDate}
                      onChange={(event) =>
                        setDraftRange((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-lg border border-gray-200 px-2 text-[11px] text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-500">
                      To
                    </label>

                    <input
                      type="date"
                      value={draftRange.endDate}
                      min={draftRange.startDate}
                      max={formatInputDate(new Date())}
                      onChange={(event) =>
                        setDraftRange((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-lg border border-gray-200 px-2 text-[11px] text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={resetDateRange}
                    className="text-[10px] font-medium text-gray-500 transition hover:text-gray-900"
                  >
                    Reset
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftRange(dateRange);

                        setDateFilterOpen(false);
                      }}
                      className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-500 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={applyDateRange}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => loadDashboard(dateRange)}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <p className="mt-0.5 text-xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                {stat.trend === "up" && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}

                {stat.trend === "down" && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                    <ArrowDownRight className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}

                {stat.trend === "warning" && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}

                <span className="truncate text-[9px] text-gray-400">
                  {stat.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          COMPACT ANALYTICS
      ================================================== */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />

            <span className="truncate text-[9px] text-gray-500">
              NCR Closure
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {ncrAnalytics.closureRate ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-amber-500" />

            <span className="truncate text-[9px] text-gray-500">
              CAPA Closure
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {capaAnalytics.closureRate ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 text-indigo-500" />

            <span className="truncate text-[9px] text-gray-500">
              Audit Completion
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {auditAnalytics.completionRate ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-emerald-500" />

            <span className="truncate text-[9px] text-gray-500">
              Document Approval
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {documentAnalytics.approvalRate ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />

            <span className="truncate text-[9px] text-gray-500">Overdue</span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {overdue.total ?? overdue.count ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

            <span className="truncate text-[9px] text-gray-500">
              Audit Readiness
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {auditReadiness.score ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />

            <span className="truncate text-[9px] text-gray-500">
              Compliance
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {compliance.score ?? 0}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />

            <span className="truncate text-[9px] text-gray-500">
              NCR Overdue
            </span>
          </div>

          <p className="mt-0.5 text-base font-bold text-gray-900">
            {overdue.ncr ?? 0}
          </p>
        </div>
      </div>

      {/* ==================================================
          ROW 1
          NCR & CAPA TREND
          + NCR CLOSURE RATE
          + NCR BY CATEGORY
      ================================================== */}

      <div className="grid gap-2.5 xl:grid-cols-3">
        {/* ==================================================
            NCR & CAPA TREND
        ================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                NCR & CAPA Trend
              </h2>

              <p className="mt-0.5 text-[10px] text-gray-500">
                Opened and closed quality issues during the selected period.
              </p>
            </div>

            <div className="hidden items-center gap-3 text-[9px] text-gray-500 sm:flex">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                NCR Opened
              </span>

              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                NCR Closed
              </span>
            </div>
          </div>

          <div className="mt-2 h-[165px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{
                  top: 5,
                  right: 5,
                  left: -25,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="ncrOpenedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />

                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient
                    id="ncrClosedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />

                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                  allowDecimals={false}
                />

                <Tooltip content={<ChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="ncrOpened"
                  name="NCR Opened"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#ncrOpenedGradient)"
                  dot={false}
                  activeDot={{
                    r: 3,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="ncrClosed"
                  name="NCR Closed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#ncrClosedGradient)"
                  dot={false}
                  activeDot={{
                    r: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==================================================
            NCR CLOSURE RATE
        ================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              NCR Closure Rate
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-500">
              Monthly NCR closure performance.
            </p>
          </div>

          <div className="mt-2 h-[165px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{
                  top: 5,
                  right: 0,
                  left: -30,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                  tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                  formatter={(value) => [`${value}%`, "Closure"]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                    fontSize: "11px",
                  }}
                />

                <Bar
                  dataKey="compliance"
                  name="Closure"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==================================================
            NCR BY CATEGORY
        ================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              NCR by Category
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-500">
              Distribution of currently open NCRs.
            </p>
          </div>

          <div className="mt-1 flex min-h-[120px] items-center gap-3">
            <div className="h-[120px] w-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ncrCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={48}
                    paddingAngle={2}
                  >
                    {ncrCategoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={ncrColors[index % ncrColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              {ncrCategoryData.length > 0 ? (
                ncrCategoryData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: ncrColors[index % ncrColors.length],
                        }}
                      />

                      <span className="truncate text-[10px] text-gray-600">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">
                  No open NCR category data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          ROW 2
          CAPA STATUS + RECENT ACTIVITY
      ================================================== */}

      <div className="grid gap-2.5 lg:grid-cols-2">
        {/* ==================================================
            CAPA STATUS
        ================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">CAPA Status</h2>

            <p className="mt-0.5 text-[10px] text-gray-500">
              Current corrective and preventive action status.
            </p>
          </div>

          <div className="mt-1 flex min-h-[120px] items-center gap-3">
            <div className="h-[120px] w-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capaStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={48}
                    paddingAngle={2}
                  >
                    {capaStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={capaColors[index % capaColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              {capaStatusData.length > 0 ? (
                capaStatusData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            capaColors[index % capaColors.length],
                        }}
                      />

                      <span className="truncate text-[10px] text-gray-600">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">
                  No CAPA status data.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Activity
              </h2>

              <p className="mt-0.5 text-[9px] text-gray-500">
                Latest activity across your QMS environment.
              </p>
            </div>

            <Activity className="h-4 w-4 text-gray-400" />
          </div>

          <div className="max-h-[125px] overflow-y-auto">
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;

                  return (
                    <button
                      type="button"
                      key={activity._id || index}
                      onClick={() => handleActivityClick(activity)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-gray-50"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${activity.iconClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-medium text-gray-900">
                          {activity.title || "Activity"}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] text-gray-500">
                          {activity.description || ""}
                        </p>
                      </div>

                      <span className="shrink-0 text-[8px] text-gray-400">
                        {activity.time || activity.createdAt
                          ? new Date(
                              activity.time || activity.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-[10px] text-gray-400">
                No recent activity.
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={handleViewAllActivity}
              className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all activity
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
