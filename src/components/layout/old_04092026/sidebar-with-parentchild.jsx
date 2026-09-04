"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthProvider.jsx";
import { PERMISSIONS } from "@/lib/auth/permissions.js";

// ==========================================================
// NAVIGATION SECTIONS
// ==========================================================

const navigationSections = [
  {
    title: "QUALITY MANAGEMENT",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        title: "Non-Conformance",
        href: "/ncr",
        icon: "ncr",
        permission: PERMISSIONS.NCR_VIEW,
      },
      {
        title: "CAPA",
        href: "/capa",
        icon: "capa",
        permission: PERMISSIONS.CAPA_VIEW,
      },
      {
        title: "Audits",
        href: "/audits",
        icon: "audit",
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        title: "Documents",
        href: "/documents",
        icon: "document",
        permission: PERMISSIONS.DOCUMENT_VIEW,
      },
      {
        title: "Training",
        href: "/training",
        icon: "training",
        permission: PERMISSIONS.TRAINING_VIEW,
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: "supplier",
        permission: PERMISSIONS.SUPPLIER_VIEW,
      },
    ],
  },

  {
    title: "REPORTING",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: "report",
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },
];

// ==========================================================
// ADMINISTRATION
// ==========================================================

const administration = [
  {
    title: "Organization",
    icon: "organization",
    href: "/administration/organization",
    permission: PERMISSIONS.ORGANIZATION_VIEW,
  },
  {
    title: "Users",
    icon: "users",
    href: "/administration/users",
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    title: "Roles",
    icon: "roles",
    href: "/administration/roles",
    permission: PERMISSIONS.ROLE_VIEW,
  },
  {
    title: "Permissions",
    icon: "permissions",
    href: "/administration/permissions",
    permission: PERMISSIONS.PERMISSION_VIEW,
  },
  {
    title: "Audit Logs",
    icon: "auditLogs",
    href: "/administration/auditLogs",
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    title: "Page Meta Data",
    icon: "metadata",
    href: "/administration/pageMetadata",
    permission: PERMISSIONS.PAGEMETA_VIEW,
  },
];

// ==========================================================
// SETTINGS
// ==========================================================

const settings = [
  {
    title: "Profile",
    icon: "profile",
    href: "/settings/profile",
  },
];

// ==========================================================
// ICON
// ==========================================================

function Icon({ type }) {
  const common = "h-5 w-5 shrink-0";

  if (type === "dashboard") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "document") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 3h7l4 4v14H7V3Z"
        />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          d="M14 3v5h5M10 13h4M10 17h4"
        />
      </svg>
    );
  }

  if (type === "audit") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeWidth="2" strokeLinecap="round" d="M9 5h6M9 9h6M9 13h4" />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 3h12v18H6V3Z"
        />
      </svg>
    );
  }

  if (type === "report") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeWidth="2" strokeLinecap="round" d="M4 19V5M4 19h16" />
        <path strokeWidth="2" strokeLinecap="round" d="m7 15 3-4 3 2 5-7" />
      </svg>
    );
  }

  if (type === "ncr") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3 3 7v5c0 5.5 3.8 8.9 9 10 5.2-1.1 9-4.5 9-10V7l-9-4Z"
        />
        <path strokeWidth="2" strokeLinecap="round" d="M12 8v4M12 16h.01" />
      </svg>
    );
  }

  if (type === "capa") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3 4 7v5c0 4.5 3 7.8 8 9 5-1.2 8-4.5 8-9V7l-8-4Z"
        />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.5 12 2.2 2.2 4.8-5"
        />
      </svg>
    );
  }

  if (type === "training") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m3 7 9-4 9 4-9 4-9-4Z"
        />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 10v5c3 2 7 2 10 0v-5"
        />
        <path strokeWidth="2" strokeLinecap="round" d="M21 8v6" />
      </svg>
    );
  }

  if (type === "supplier") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 20V7l8-4 8 4v13H4Z"
        />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          d="M8 20v-6h8v6M9 9h.01M12 9h.01M15 9h.01"
        />
      </svg>
    );
  }

  if (type === "organization") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01"
        />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        />
        <circle cx="9" cy="7" r="4" strokeWidth="2" />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        />
      </svg>
    );
  }

  if (type === "roles") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 4v5c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V7l7-4Z"
        />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4"
        />
      </svg>
    );
  }

  if (type === "permissions") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="8" cy="15" r="4" strokeWidth="2" />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 12l8-8M16 5l3 3M14 7l3 3"
        />
      </svg>
    );
  }

  if (type === "auditLogs") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5h16M4 12h16M4 19h16"
        />
        <circle cx="7" cy="5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="19" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "metadata") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4h16v16H4V4Z"
        />
        <path strokeWidth="2" strokeLinecap="round" d="M8 8h8M8 12h5M8 16h7" />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg
        className={common}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="8" r="4" strokeWidth="2" />
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 21a8 8 0 0116 0"
        />
      </svg>
    );
  }

  return (
    <svg
      className={common}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 8v4l2 2" />
    </svg>
  );
}

// ==========================================================
// CHEVRON
// ==========================================================

function Chevron({ open }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

// ==========================================================
// NAVIGATION LINK
// ==========================================================

function NavigationLink({ item, isActive, onClick, nested = false }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-lg
        ${nested ? "px-3" : "px-3"}
        py-2.5 text-sm font-medium transition
        ${isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}
      `}
    >
      <Icon type={item.icon} />

      <span>{item.title}</span>
    </Link>
  );
}

// ==========================================================
// SIDEBAR
// ==========================================================

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();

  const { hasPermission, loading: authLoading, initialized } = useAuth();

  // ========================================================
  // ACTIVE SECTIONS
  // ========================================================

  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  const administrationActive =
    pathname === "/administration" || pathname.startsWith("/administration/");

  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const [administrationOpen, setAdministrationOpen] =
    useState(administrationActive);

  // ========================================================
  // AUTO OPEN ACTIVE SECTION
  // ========================================================

  useEffect(() => {
    if (settingsActive) {
      setSettingsOpen(true);
    }

    if (administrationActive) {
      setAdministrationOpen(true);
    }
  }, [settingsActive, administrationActive]);

  // ========================================================
  // PERMISSION CHECK
  // ========================================================

  const canAccess = (item) => {
    if (!item.permission) {
      return true;
    }

    if (authLoading || !initialized) {
      return false;
    }

    return hasPermission(item.permission);
  };

  // ========================================================
  // ACTIVE LINK
  // ========================================================

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // ========================================================
  // LINK CLICK
  // ========================================================

  const handleLinkClick = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // ========================================================
  // VISIBLE SECTIONS
  // ========================================================

  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(canAccess),
    }))
    .filter((section) => section.items.length > 0);

  const visibleAdministration = administration.filter(canAccess);

  const visibleSettings = settings.filter(canAccess);

  return (
    <>
      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64
          flex-col border-r border-gray-200 bg-white
          transition-transform duration-200
          lg:static lg:z-auto lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div>
            <div className="text-xl font-bold text-gray-900">QMS AI</div>

            <div className="text-xs text-gray-500">
              Quality Management System
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* ==================================================
              NAVIGATION SECTIONS
          ================================================== */}

          {visibleSections.map((section) => (
            <div key={section.title} className="mb-7">
              {/* SECTION HEADING */}

              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                {section.title}
              </div>

              {/* SECTION ITEMS */}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={handleLinkClick}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          {visibleSettings.length > 0 && (
            <div className="mb-7">
              <button
                type="button"
                onClick={() => setSettingsOpen((value) => !value)}
                className={`
                  flex w-full items-center
                  justify-between rounded-lg
                  px-3 py-2.5 text-sm
                  font-semibold transition
                  ${
                    settingsActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span>SETTINGS</span>

                <Chevron open={settingsOpen} />
              </button>

              {settingsOpen && (
                <div className="mt-1 space-y-1 pl-3">
                  {visibleSettings.map((item) => (
                    <NavigationLink
                      key={item.href}
                      item={item}
                      isActive={isActive(item.href)}
                      onClick={handleLinkClick}
                      nested
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================
              ADMINISTRATION
          ================================================== */}

          {visibleAdministration.length > 0 && (
            <div className="mb-7">
              <button
                type="button"
                onClick={() => setAdministrationOpen((value) => !value)}
                className={`
                  flex w-full items-center
                  justify-between rounded-lg
                  px-3 py-2.5 text-sm
                  font-semibold transition
                  ${
                    administrationActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span>ADMINISTRATION</span>

                <Chevron open={administrationOpen} />
              </button>

              {administrationOpen && (
                <div className="mt-1 space-y-1 pl-3">
                  {visibleAdministration.map((item) => (
                    <NavigationLink
                      key={item.href}
                      item={item}
                      isActive={isActive(item.href)}
                      onClick={handleLinkClick}
                      nested
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium text-gray-500">QMS AI</div>

            <div className="mt-1 text-xs text-gray-400">
              Quality Management Platform
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
