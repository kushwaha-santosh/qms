"use client";
import Link from "next/link";
import { Bell, HelpCircle, Menu, Moon, Search, Sun } from "lucide-react";

import UserMenu from "./UserMenu";
import { useTheme } from "@/context/ThemeProvider";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme, mounted } = useTheme();

  const isDark = theme === "dark";

  return (
    <header
      className="
        sticky top-0 z-40
        flex h-16
        items-center
        justify-between

        border-b border-gray-200
        bg-white

        px-4
        sm:px-6

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}

        <button
          type="button"
          onClick={onMenuClick}
          className="
            rounded-lg
            p-2

            text-gray-600
            transition

            hover:bg-gray-100
            hover:text-gray-900

            dark:text-slate-400
            dark:hover:bg-slate-800
            dark:hover:text-white

            lg:hidden
          "
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo */}

        <div className="lg:hidden">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            QMS AI
          </div>
        </div>

        {/* ===================================================
            GLOBAL SEARCH
        =================================================== */}

        {/* <button
          type="button"
          className="
            hidden
            h-9
            min-w-[260px]
            items-center
            gap-2

            rounded-lg
            border border-gray-200
            bg-gray-50

            px-3
            text-left
            text-sm
            text-gray-400

            transition

            hover:border-gray-300
            hover:bg-white

            dark:border-slate-700
            dark:bg-slate-800
            dark:text-slate-500
            dark:hover:border-slate-600
            dark:hover:bg-slate-800

            md:flex
            lg:min-w-[340px]
          "
          aria-label="Global search"
        >
          <Search className="h-4 w-4 shrink-0" />

          <span className="flex-1">Search NCR, CAPA, Audit, Document...</span>

          <kbd
            className="
              rounded
              border border-gray-200
              bg-white
              px-1.5
              py-0.5
              text-[10px]
              text-gray-400

              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-500
            "
          >
            Ctrl K
          </kbd>
        </button> */}
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="flex items-center gap-1 sm:gap-2">
        {/* ===================================================
            LIGHT / DARK MODE
        =================================================== */}

        <button
          type="button"
          onClick={toggleTheme}
          disabled={!mounted}
          className="
            rounded-lg
            p-2

            text-gray-500
            transition

            hover:bg-gray-100
            hover:text-gray-900

            disabled:cursor-default
            disabled:opacity-60

            dark:text-slate-400
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {mounted ? (
            isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* ===================================================
            HELP
        =================================================== */}

        <Link
          href="/help"
          className="
    hidden
    rounded-lg
    p-2

    text-gray-500
    transition

    hover:bg-gray-100
    hover:text-gray-900

    dark:text-slate-400
    dark:hover:bg-slate-800
    dark:hover:text-white

    sm:block
  "
          aria-label="Help"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}
        <NotificationBell />

        {/* <button
          type="button"
          className="
            relative
            rounded-lg
            p-2

            text-gray-500
            transition

            hover:bg-gray-100
            hover:text-gray-900

            dark:text-slate-400
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />

          <span
            className="
              absolute
              right-1.5
              top-1.5
              h-1.5
              w-1.5
              rounded-full
              bg-red-500
            "
          />
        </button> */}

        {/* ===================================================
            USER MENU
        =================================================== */}

        <UserMenu />
      </div>
    </header>
  );
}
