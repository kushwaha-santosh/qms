"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FileWarning,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Building2,
  BarChart3,
  User,
  Users,
  UserCog,
  KeyRound,
  ListFilter,
  FileSpreadsheet,
  TableProperties,
  MapPin,
  Package,
} from "lucide-react";

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
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        title: "Non-Conformance",
        href: "/ncr",
        icon: FileWarning,
        permission: PERMISSIONS.NCR_VIEW,
      },
      {
        title: "CAPA",
        href: "/capa",
        icon: ShieldCheck,
        permission: PERMISSIONS.CAPA_VIEW,
      },
      {
        title: "Audits",
        href: "/audits",
        icon: ClipboardCheck,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FileText,
        permission: PERMISSIONS.DOCUMENT_VIEW,
      },
      {
        title: "Training",
        href: "/training",
        icon: GraduationCap,
        permission: PERMISSIONS.TRAINING_VIEW,
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: Building2,
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
        icon: BarChart3,
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },

  {
    title: "SETTINGS",
    items: [
      {
        title: "Profile",
        href: "/settings/profile",
        icon: User,
      },
    ],
  },

  {
    title: "ADMINISTRATION",
    items: [
      {
        title: "Organization",
        href: "/administration/organization",
        icon: Building2,
        permission: PERMISSIONS.ORGANIZATION_VIEW,
      },
      {
        title: "Users",
        href: "/administration/users",
        icon: Users,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        title: "Roles",
        href: "/administration/roles",
        icon: UserCog,
        permission: PERMISSIONS.ROLE_VIEW,
      },
      {
        title: "Permissions",
        href: "/administration/permissions",
        icon: KeyRound,
        permission: PERMISSIONS.PERMISSION_VIEW,
      },
      {
        title: "Master Data",
        href: "/administration/master-data",
        icon: TableProperties,
        permission: PERMISSIONS.PAGEMETA_VIEW,
      },
      {
        title: "Products",
        href: "/administration/products",
        icon: Package,
        permission: PERMISSIONS.PRODUCT_VIEW,
      },
      {
        title: "Location",
        href: "/administration/locations",
        icon: MapPin,
        permission: PERMISSIONS.LOCATION_VIEW,
      },
      {
        title: "Audit Logs",
        href: "/administration/auditLogs",
        icon: ListFilter,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        title: "Page Meta Data",
        href: "/administration/pageMetadata",
        icon: FileSpreadsheet,
        permission: PERMISSIONS.PAGEMETA_VIEW,
      },
    ],
  },
];

// ==========================================================
// SIDEBAR LINK
// ==========================================================

function SidebarLink({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        flex items-center gap-3
        rounded-lg px-3 py-2.5
        text-sm font-medium
        transition-all duration-150
        ${
          active
            ? "bg-black text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />

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
  // PERMISSION CHECK
  // ========================================================

  const canAccess = (item) => {
    // Items without a permission requirement
    // are available to authenticated users.
    if (!item.permission) {
      return true;
    }

    // Hide protected navigation while auth is initializing.
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
  // FILTER VISIBLE SECTIONS
  // ========================================================

  const visibleSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(canAccess),
    }))
    .filter((section) => section.items.length > 0);

  // ========================================================
  // RENDER
  // ========================================================

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
          className="
            fixed inset-0 z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50

          flex h-screen w-64
          flex-col

          border-r border-gray-200
          bg-white
          shadow-sm

          transition-transform duration-200

          lg:translate-x-0

          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* ==================================================
            LOGO / HEADER
        ================================================== */}

        <div
          className="
            flex h-16 shrink-0
            items-center
            border-b border-gray-200
            bg-white
            px-6
          "
        >
          <div>
            <div className="text-xl font-bold text-gray-900">QMS AI</div>

            <div className="text-xs text-gray-500">
              Quality Management System
            </div>
          </div>

          {/* Mobile close button */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              ml-auto
              rounded-lg
              p-2
              text-gray-500
              hover:bg-gray-100
              lg:hidden
            "
          >
            ✕
          </button>
        </div>

        {/* ==================================================
            SCROLLABLE NAVIGATION
        ================================================== */}

        <nav
          className="
            min-h-0
            flex-1
            overflow-y-auto

            px-3
            py-5

            scrollbar-thin
            scrollbar-thumb-gray-300
            scrollbar-track-transparent

            hover:scrollbar-thumb-gray-400
          "
        >
          {visibleSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              className={sectionIndex === 0 ? "" : "mt-7"}
            >
              {/* ==================================================
                    SECTION HEADING
                ================================================== */}

              <div className="mb-2 px-3">
                <div
                  className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-gray-400
                    "
                >
                  {section.title}
                </div>
              </div>

              {/* ==================================================
                    SECTION ITEMS
                ================================================== */}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={handleLinkClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ==================================================
            FIXED FOOTER
        ================================================== */}

        <div
          className="
            h-16 shrink-0
            border-t border-gray-200
            bg-white
            p-3
          "
        >
          <div
            className="
              flex h-full
              items-center
              rounded-lg
              bg-gray-50
              px-3
            "
          >
            <div>
              <div className="text-xs font-medium text-gray-500">QMS AI</div>

              <div className="mt-0.5 text-[10px] text-gray-400">
                Quality Management Platform
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
