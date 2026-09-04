"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((current) => !current);
  };

  return (
    <div className="min-h-screen bg-white transition-colors duration-200 dark:bg-slate-950">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setMobileOpen(false)}
        onToggle={handleSidebarToggle}
      />

      <div
        className={`
          min-h-screen
          bg-white
          transition-[margin]
          duration-200
          dark:bg-slate-950
          ${sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-64"}
        `}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main
          className="
            min-h-[calc(100vh-4rem)]
            bg-white
            p-4
            sm:p-6
            dark:bg-slate-950
          "
        >
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
