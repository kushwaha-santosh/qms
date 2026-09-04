"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  FileWarning,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  ListFilter,
  MapPin,
  Package,
  ShieldCheck,
  TableProperties,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthProvider.jsx";
import { PERMISSIONS } from "@/lib/auth/permissions.js";

/* =========================================================
   NAVIGATION CONFIGURATION
   ========================================================= */

const navigationSections = [
  {
    label: "QUALITY",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        label: "Non-Conformance",
        href: "/ncr",
        icon: FileWarning,
        permission: PERMISSIONS.NCR_VIEW,
      },
      {
        label: "CAPA",
        href: "/capa",
        icon: ClipboardCheck,
        permission: PERMISSIONS.CAPA_VIEW,
      },
      {
        label: "Audits",
        href: "/audits",
        icon: ShieldCheck,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FileText,
        permission: PERMISSIONS.DOCUMENT_VIEW,
      },
      {
        label: "Training",
        href: "/training",
        icon: GraduationCap,
        permission: PERMISSIONS.TRAINING_VIEW,
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Package,
        permission: PERMISSIONS.SUPPLIER_VIEW,
      },
    ],
  },

  {
    label: "INSIGHTS",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },

  {
    label: "SETTINGS",
    items: [
      {
        label: "Profile",
        href: "/settings/profile",
        icon: User,
        permission: null,
      },
    ],
  },

  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Organization",
        href: "/administration/organization",
        icon: Building2,
        permission: PERMISSIONS.ORGANIZATION_VIEW,
      },
      {
        label: "Users",
        href: "/administration/users",
        icon: Users,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        label: "Roles",
        href: "/administration/roles",
        icon: UserCog,
        permission: PERMISSIONS.ROLE_VIEW,
      },
      {
        label: "Permissions",
        href: "/administration/permissions",
        icon: KeyRound,
        permission: PERMISSIONS.PERMISSION_VIEW,
      },
      {
        label: "Master Data",
        href: "/administration/master-data",
        icon: ListFilter,
        permission: PERMISSIONS.PAGEMETA_VIEW,
      },
      {
        label: "Products",
        href: "/administration/products",
        icon: TableProperties,
        permission: PERMISSIONS.PRODUCT_VIEW,
      },
      {
        label: "Location",
        href: "/administration/locations",
        icon: MapPin,
        permission: PERMISSIONS.LOCATION_VIEW,
      },
      {
        label: "Audit Logs",
        href: "/administration/auditLogs",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        label: "Page Meta Data",
        href: "/administration/pageMetadata",
        icon: TableProperties,
        permission: PERMISSIONS.PAGEMETA_VIEW,
      },
    ],
  },
];

/* =========================================================
   SIDEBAR LINK
   ========================================================= */

function SidebarLink({ item, active, collapsed, onClick }) {
  const Icon = item.icon;

  return (
    <div className="group relative">
      <Link
        href={item.href}
        onClick={onClick}
        className={`
          flex h-9 w-full items-center rounded-lg
          text-[13px] font-medium
          transition-all duration-150

          ${
            active
              ? "bg-slate-900 text-white shadow-sm dark:bg-blue-600"
              : `
                text-slate-600
                hover:bg-slate-100
                hover:text-slate-900
                dark:text-slate-300
                dark:hover:bg-slate-800
                dark:hover:text-white
              `
          }

          ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
        `}
      >
        <Icon className="h-[17px] w-[17px] shrink-0" />

        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          className="
            pointer-events-none
            absolute left-full top-1/2 z-[100]
            ml-2 hidden
            -translate-y-1/2
            whitespace-nowrap
            rounded-md
            bg-slate-900
            px-2.5 py-1.5
            text-xs font-medium
            text-white
            shadow-lg
            group-hover:block
            dark:bg-slate-700
          "
        >
          {item.label}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

export default function Sidebar({
  mobileOpen = false,
  collapsed = false,
  onClose,
  onToggle,
}) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  /* =======================================================
     PERMISSION CHECK
     ======================================================= */

  const canAccessItem = (item) => {
    if (!item.permission) {
      return true;
    }

    if (user?.role === "SUPER_ADMIN") {
      return true;
    }

    if (typeof hasPermission === "function") {
      return hasPermission(item.permission);
    }

    return false;
  };

  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(canAccessItem),
    }))
    .filter((section) => section.items.length > 0);

  /* =======================================================
     ACTIVE ROUTE
     ======================================================= */

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  /* =======================================================
     MOBILE NAVIGATION
     ======================================================= */

  const handleNavigation = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  /* =======================================================
     SIDEBAR
     ======================================================= */

  return (
    <>
      {/* ===================================================
          MOBILE OVERLAY
          =================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="
            fixed inset-0
            z-40
            bg-slate-950/40
            backdrop-blur-[1px]
            lg:hidden
          "
        />
      )}

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0
          z-50
          flex h-screen
          flex-col
          border-r
          border-slate-200
          bg-white
          shadow-sm
          transition-[width,transform]
          duration-200

          dark:border-slate-800
          dark:bg-slate-900

          lg:translate-x-0

          ${collapsed ? "w-[68px]" : "w-64"}

          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <div
          className={`
            flex
            h-16
            shrink-0
            items-center
            border-b
            border-slate-200
            dark:border-slate-800

            ${collapsed ? "justify-center px-2" : "justify-between px-3"}
          `}
        >
          {/* =================================================
              BRAND
              ================================================= */}

          <Link
            href="/dashboard"
            onClick={handleNavigation}
            className={`
              flex
              min-w-0
              items-center

              ${collapsed ? "justify-center" : "gap-3"}
            `}
          >
            {/* Q ICON */}

            <div
              className="
    flex
    h-9
    w-9
    shrink-0
    items-center
    justify-center
    rounded-xl
    bg-slate-900
    text-sm
    font-bold
    text-white
    shadow-sm

    dark:!border
    dark:!border-white
    dark:!bg-transparent
    dark:!text-white
    dark:!shadow-none
    qms-sidebar-logo"
            >
              Q
            </div>

            {/* BRAND TEXT */}

            {!collapsed && (
              <div className="min-w-0">
                <div
                  className="
                    truncate
                    text-[15px]
                    font-bold
                    tracking-tight
                    text-slate-900
                    dark:text-white
                  "
                >
                  QMS AI
                </div>

                <div
                  className="
                    truncate
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.12em]
                    text-slate-400
                  "
                >
                  {/* Quality Management */}
                </div>
              </div>
            )}
          </Link>

          {/* =================================================
              DESKTOP COLLAPSE / EXPAND BUTTON

              ONLY CONTROL FOR COLLAPSE / EXPAND
              ================================================= */}

          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="
              hidden
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-500
              transition

              hover:bg-slate-100
              hover:text-slate-900

              dark:text-slate-400
              dark:hover:bg-slate-800
              dark:hover:text-white

              lg:flex
            "
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* =================================================
              MOBILE CLOSE BUTTON

              This is NOT collapse/expand.
              ================================================= */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-500

              hover:bg-slate-100
              hover:text-slate-900

              dark:text-slate-400
              dark:hover:bg-slate-800
              dark:hover:text-white

              lg:hidden
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            px-2.5
            py-3
          "
        >
          <div className="space-y-5">
            {visibleSections.map((section) => (
              <div key={section.label}>
                {/* SECTION LABEL */}

                {!collapsed ? (
                  <div
                    className="
                      mb-1.5
                      px-2.5
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-slate-400
                      dark:text-slate-500
                    "
                  >
                    {section.label}
                  </div>
                ) : (
                  <div
                    className="
                      mb-1.5
                      h-px
                      bg-slate-100
                      dark:bg-slate-800
                    "
                  />
                )}

                {/* LINKS */}

                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      collapsed={collapsed}
                      onClick={handleNavigation}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* =================================================
            FOOTER

            NO COLLAPSE / EXPAND BUTTON HERE
            ================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-slate-200
            px-3
            py-3
            dark:border-slate-800
          "
        >
          {!collapsed ? (
            <div className="text-center">
              {/* <div
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-slate-400
                  dark:text-slate-500
                "
              >
                QMS AI
              </div> */}

              <div
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-400
                  dark:text-slate-500
                "
              >
                © {new Date().getFullYear()} QMS AI
              </div>
            </div>
          ) : (
            <div
              className="
                text-center
                text-[9px]
                font-medium
                text-slate-400
                dark:text-slate-500
              "
              title={`© ${new Date().getFullYear()} QMS AI`}
            >
              © {new Date().getFullYear()}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
