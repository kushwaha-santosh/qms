// ==========================================================
// INITIAL PAGE METADATA SEED CONFIGURATION
// ==========================================================
//
// IMPORTANT:
//
// This file is ONLY used to populate the PageMetadata
// collection during initial setup/migration.
//
// Runtime page metadata MUST come from MongoDB.
//
// Super Admin / Org Admin can manage metadata from:
//
// /administration/pageMetadata
//
// DO NOT use this file for runtime metadata lookup.
//
// ==========================================================

export const PAGE_METADATA = [
  {
    key: "dashboard",
    path: "/dashboard",
    title: "Dashboard | QMS AI",
    description:
      "Quality Management System dashboard for monitoring quality activities, KPIs, NCRs, CAPA, audits and compliance.",
    keywords:
      "QMS, Quality Management System, dashboard, quality management, compliance",
  },

  {
    key: "ncr",
    path: "/ncr",
    title: "Non-Conformance | QMS AI",
    description:
      "Manage and track non-conformance reports, corrective actions and quality issues.",
    keywords: "NCR, non-conformance, quality issue, quality management, QMS",
  },

  {
    key: "capa",
    path: "/capa",
    title: "CAPA | QMS AI",
    description:
      "Manage corrective and preventive actions and monitor their progress.",
    keywords:
      "CAPA, corrective action, preventive action, QMS, quality management",
  },

  {
    key: "audits",
    path: "/audits",
    title: "Audits | QMS AI",
    description: "Plan, manage and track quality audits and audit activities.",
    keywords: "audit, quality audit, compliance audit, QMS",
  },

  {
    key: "documents",
    path: "/documents",
    title: "Documents | QMS AI",
    description:
      "Manage controlled documents, approvals and quality documentation.",
    keywords: "documents, document control, quality documents, QMS",
  },

  {
    key: "training",
    path: "/training",
    title: "Training | QMS AI",
    description:
      "Manage employee training, training records and competency requirements.",
    keywords: "training, employee training, competency, QMS",
  },

  {
    key: "suppliers",
    path: "/suppliers",
    title: "Suppliers | QMS AI",
    description:
      "Manage suppliers, supplier quality and supplier-related activities.",
    keywords: "suppliers, supplier quality, vendor management, QMS",
  },

  {
    key: "reports",
    path: "/reports",
    title: "Reports | QMS AI",
    description:
      "View quality management reports, metrics and performance indicators.",
    keywords: "quality reports, QMS reports, quality metrics, compliance",
  },

  {
    key: "organization",
    path: "/administration/organization",
    title: "Organization Management | QMS AI",
    description:
      "Manage organization settings and quality management configuration.",
    keywords: "organization management, QMS, organization settings",
  },

  {
    key: "users",
    path: "/administration/users",
    title: "User Management | QMS AI",
    description: "Manage users, user accounts, roles and organization access.",
    keywords: "users, user management, RBAC, roles, QMS",
  },

  {
    key: "roles",
    path: "/administration/roles",
    title: "Role Management | QMS AI",
    description: "Manage organization roles and role-based access control.",
    keywords: "roles, RBAC, role management, access control, QMS",
  },

  {
    key: "permissions",
    path: "/administration/permissions",
    title: "Permission Management | QMS AI",
    description: "Manage system permissions and access control capabilities.",
    keywords: "permissions, RBAC, access control, permissions management, QMS",
  },

  {
    key: "auditLogs",
    path: "/administration/auditLogs",
    title: "Audit Logs | QMS AI",
    description:
      "Track user and system activity across the Quality Management System.",
    keywords: "audit logs, activity logs, user activity, system audit, QMS",
  },

  {
    key: "pageMetadata",
    path: "/administration/pageMetadata",
    title: "Page Metadata | QMS AI",
    description:
      "Manage page titles, descriptions and keywords used by QMS AI pages.",
    keywords: "page metadata, SEO, page title, meta description, keywords, QMS",
  },

  {
    key: "profile",
    path: "/settings/profile",
    title: "Profile | QMS AI",
    description: "Update user current profile.",
    keywords: "Update user current profile.",
  },
];

// ==========================================================
// SEED LOOKUPS
// ==========================================================
//
// These are ONLY for seed/migration scripts.
// Runtime application code should query MongoDB instead.
// ==========================================================

export const getSeedPageMetadataByPath = (path) => {
  const normalizedPath = String(path || "").trim();

  return PAGE_METADATA.find((page) => page.path === normalizedPath);
};

export const getSeedPageMetadataByKey = (key) => {
  const normalizedKey = String(key || "")
    .trim()
    .toLowerCase();

  return PAGE_METADATA.find((page) => page.key.toLowerCase() === normalizedKey);
};
