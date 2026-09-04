"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  GraduationCap,
  Info,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications.api.js";
const icons = {
  NCR: FileWarning,
  CAPA: ShieldAlert,
  AUDIT: ClipboardCheck,
  DOCUMENTS: FileCheck2,
  TRAINING: GraduationCap,
  SYSTEM: Info,
};
const priority = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const time = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};
export default function NotificationBell() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false),
    [items, setItems] = useState([]),
    [count, setCount] = useState(0),
    [loading, setLoading] = useState(false),
    [all, setAll] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const r = await getNotifications({ page: 1, limit: 8 });
      setItems(Array.isArray(r?.data) ? r.data : []);
      setCount(Number(r?.unreadCount || 0));
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);
  useEffect(() => {
    const f = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const read = async (item) => {
    if (!item?._id) return;
    if (!item.isRead) {
      try {
        await markNotificationRead(item._id);
        setItems((x) =>
          x.map((n) =>
            String(n._id) === String(item._id)
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setCount((x) => Math.max(x - 1, 0));
      } catch (e) {
        console.error(e);
      }
    }
    setOpen(false);
  };
  const markAll = async () => {
    if (!count || all) return;
    try {
      setAll(true);
      await markAllNotificationsRead();
      setItems((x) =>
        x.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
      );
      setCount(0);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to mark notifications as read.",
      );
    } finally {
      setAll(false);
    }
  };
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((x) => !x);
          if (!open) load();
        }}
        aria-label="Notifications"
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <Bell className="h-[19px] w-[19px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-400">
                {count ? `${count} unread` : "You're all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  disabled={all}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {all ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="max-h-[430px] overflow-y-auto">
            {loading && !items.length ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : !items.length ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  New QMS activity will appear here.
                </p>
              </div>
            ) : (
              items.map((n) => {
                const I = icons[n.module] || Info;
                const c = priority[n.priority] || priority.MEDIUM;
                const body = (
                  <div
                    className={`flex gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 ${n.isRead ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c}`}
                    >
                      <I className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-5 ${n.isRead ? "font-medium text-slate-700 dark:text-slate-200" : "font-semibold text-slate-900 dark:text-white"}`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {time(n.createdAt)}
                      </span>
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link
                    key={n._id}
                    href={n.href}
                    onClick={() => read(n)}
                    className="block border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => read(n)}
                    className="block w-full border-b border-slate-100 text-left last:border-0 dark:border-slate-800"
                  >
                    {body}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
