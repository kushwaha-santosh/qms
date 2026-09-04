"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* =====================================================
          MAIN APPLICATION AREA

          Desktop:
          Sidebar = fixed 64 width
          Content = margin-left 64

          Mobile:
          Sidebar = overlay
          Content = full width
      ===================================================== */}

      <div className="min-h-screen lg:ml-64">
        {/* ===================================================
            TOPBAR
        =================================================== */}

        <Topbar onMenuClick={() => setMobileOpen(true)} />

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
