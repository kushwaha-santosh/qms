"use client";
import { DataTablePagination } from "@/components/common/data-table";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  Filter,
  GraduationCap,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/api/notifications.api.js";
const modules = [
  { value: "", label: "All" },
  { value: "NCR", label: "NCR" },
  { value: "CAPA", label: "CAPA" },
  { value: "AUDIT", label: "Audits" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "TRAINING", label: "Training" },
  { value: "SYSTEM", label: "System" },
];
const icons = {
  NCR: FileWarning,
  CAPA: ShieldAlert,
  AUDIT: ClipboardCheck,
  DOCUMENTS: FileCheck2,
  TRAINING: GraduationCap,
  SYSTEM: Info,
};
const cls = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const relative = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString();
};
export default function NotificationsPage() {
  const [items, setItems] = useState([]),
    [filter, setFilter] = useState(""),
    [unread, setUnread] = useState(false),
    [count, setCount] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [pagination, setPagination] = useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  const load = useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        setError("");
        const r = await getNotifications({
          page: p,
          limit: 20,
          module: filter,
          unreadOnly: unread,
        });
        setItems(Array.isArray(r?.data) ? r.data : []);
        setCount(Number(r?.unreadCount || 0));
        setPagination(r?.pagination || pagination);
        setPage(p);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filter, unread],
  );
  useEffect(() => {
    load(1);
  }, [filter, unread]);
  const toggle = async (n) => {
    try {
      if (n.isRead) {
        await markNotificationUnread(n._id);
        setItems((x) =>
          x.map((i) =>
            i._id === n._id ? { ...i, isRead: false, readAt: null } : i,
          ),
        );
        setCount((x) => x + 1);
      } else {
        await markNotificationRead(n._id);
        setItems((x) =>
          x.map((i) =>
            i._id === n._id
              ? { ...i, isRead: true, readAt: new Date().toISOString() }
              : i,
          ),
        );
        setCount((x) => Math.max(x - 1, 0));
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to update notification.",
      );
    }
  };
  const all = async () => {
    if (!count) return;
    try {
      await markAllNotificationsRead();
      setItems((x) =>
        x.map((i) => ({
          ...i,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      setCount(0);
    } catch (e) {
      setError(e?.message || "Unable to mark all as read.");
    }
  };
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Stay informed about QMS activities that require your attention.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUnread((x) => !x)}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium ${unread ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300" : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Unread{" "}
              {count > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => load(page)}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={all}
              disabled={!count}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50 dark:bg-blue-600"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m.value || "all"}
              type="button"
              onClick={() => setFilter(m.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === m.value ? "bg-slate-900 text-white dark:bg-blue-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : !items.length ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto h-6 w-6 text-slate-400" />
            <h2 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No notifications found
            </h2>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((n) => {
              const I = icons[n.module] || Info;
              const c = cls[n.priority] || cls.MEDIUM;
              const body = (
                <div
                  className={`flex gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 ${n.isRead ? "" : "bg-slate-50/80 dark:bg-slate-800/50"}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c}`}
                  >
                    <I className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3
                          className={`text-sm ${n.isRead ? "font-medium text-slate-700 dark:text-slate-200" : "font-semibold text-slate-900 dark:text-white"}`}
                        >
                          {!n.isRead && (
                            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                          {n.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {n.message}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {relative(n.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {n.module || "SYSTEM"}
                      </span>
                      {n.priority && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${c}`}
                        >
                          {n.priority}
                        </span>
                      )}
                      {n.recordNumber && (
                        <span className="text-[10px] text-slate-400">
                          {n.recordNumber}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(n);
                        }}
                        className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {n.isRead ? (
                          <>
                            <Bell className="h-3 w-3" />
                            Mark unread
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Mark read
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link
                  key={n._id}
                  href={n.href}
                  onClick={() => {
                    if (!n.isRead) toggle(n);
                  }}
                  className="block"
                >
                  {body}
                </Link>
              ) : (
                <div key={n._id}>{body}</div>
              );
            })}
          </div>
        )}
        <DataTablePagination
          pagination={pagination}
          loading={loading}
          onPageChange={load}
          entityLabel="notifications"
          className="rounded-none border-0 shadow-none"
        />
      </section>
    </div>
  );
}
