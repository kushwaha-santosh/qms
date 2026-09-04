// ==========================================================
// QMS AI - PERMISSIONS
// ==========================================================

export const PERMISSIONS = {
  // --------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------

  DASHBOARD_VIEW: "DASHBOARD_VIEW",

  // --------------------------------------------------------
  // ORGANIZATION
  // --------------------------------------------------------

  ORGANIZATION_VIEW: "ORGANIZATION_VIEW",
  ORGANIZATION_UPDATE: "ORGANIZATION_UPDATE",

  // --------------------------------------------------------
  // USERS
  // --------------------------------------------------------

  USER_VIEW: "USER_VIEW",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_STATUS_UPDATE: "USER_STATUS_UPDATE",
  USER_ROLE_UPDATE: "USER_ROLE_UPDATE",

  // --------------------------------------------------------
  // ROLES
  // --------------------------------------------------------

  ROLE_VIEW: "ROLE_VIEW",
  ROLE_CREATE: "ROLE_CREATE",
  ROLE_UPDATE: "ROLE_UPDATE",
  ROLE_DELETE: "ROLE_DELETE",

  // --------------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------------

  PERMISSION_VIEW: "PERMISSION_VIEW",
  PERMISSION_ASSIGN: "PERMISSION_ASSIGN",

  // --------------------------------------------------------
  // NCR
  // --------------------------------------------------------

  NCR_VIEW: "NCR_VIEW",
  NCR_CREATE: "NCR_CREATE",
  NCR_UPDATE: "NCR_UPDATE",
  NCR_DELETE: "NCR_DELETE",
  NCR_STATUS_UPDATE: "NCR_STATUS_UPDATE",

  // --------------------------------------------------------
  // CAPA
  // --------------------------------------------------------

  CAPA_VIEW: "CAPA_VIEW",
  CAPA_CREATE: "CAPA_CREATE",
  CAPA_UPDATE: "CAPA_UPDATE",
  CAPA_DELETE: "CAPA_DELETE",
  CAPA_STATUS_UPDATE: "CAPA_STATUS_UPDATE",
  CAPA_ASSIGN: "CAPA_ASSIGN",

  // --------------------------------------------------------
  // AUDITS
  // --------------------------------------------------------

  AUDIT_VIEW: "AUDIT_VIEW",
  AUDIT_CREATE: "AUDIT_CREATE",
  AUDIT_UPDATE: "AUDIT_UPDATE",
  AUDIT_DELETE: "AUDIT_DELETE",

  // --------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------

  DOCUMENT_VIEW: "DOCUMENT_VIEW",
  DOCUMENT_CREATE: "DOCUMENT_CREATE",
  DOCUMENT_UPDATE: "DOCUMENT_UPDATE",
  DOCUMENT_DELETE: "DOCUMENT_DELETE",
  DOCUMENT_APPROVE: "DOCUMENT_APPROVE",
  DOCUMENT_STATUS_UPDATE: "DOCUMENT_STATUS_UPDATE",

  // --------------------------------------------------------
  // TRAINING
  // --------------------------------------------------------

  TRAINING_VIEW: "TRAINING_VIEW",
  TRAINING_CREATE: "TRAINING_CREATE",
  TRAINING_UPDATE: "TRAINING_UPDATE",
  TRAINING_DELETE: "TRAINING_DELETE",

  // --------------------------------------------------------
  // SUPPLIERS
  // --------------------------------------------------------

  SUPPLIER_VIEW: "SUPPLIER_VIEW",
  SUPPLIER_CREATE: "SUPPLIER_CREATE",
  SUPPLIER_UPDATE: "SUPPLIER_UPDATE",
  SUPPLIER_DELETE: "SUPPLIER_DELETE",

  // --------------------------------------------------------
  // REPORTS
  // --------------------------------------------------------

  REPORT_VIEW: "REPORT_VIEW",
  REPORT_EXPORT: "REPORT_EXPORT",

  AUDIT_LOG_VIEW: "AUDIT_LOG_VIEW",
  AUDIT_LOG_CREATE: "AUDIT_LOG_CREATE",
  AUDIT_LOG_UPDATE: "AUDIT_LOG_UPDATE",
  AUDIT_LOG_DELETE: "AUDIT_LOG_DELETE",

  PAGEMETA_VIEW: "PAGEMETA_VIEW",
  PAGEMETA_CREATE: "PAGEMETA_CREATE",
  PAGEMETA_UPDATE: "PAGEMETA_UPDATE",
  PAGEMETA_DELETE: "PAGEMETA_DELETE",

  MASTER_DATA_VIEW: "MASTER_DATA_VIEW",
  MASTER_DATA_CREATE: "MASTER_DATA_CREATE",
  MASTER_DATA_UPDATE: "MASTER_DATA_UPDATE",
  MASTER_DATA_DELETE: "MASTER_DATA_DELETE",
  MASTER_DATA_STATUS_UPDATE: "MASTER_DATA_STATUS_UPDATE",

  LOCATION_VIEW: "LOCATION_VIEW",
  LOCATION_CREATE: "LOCATION_CREATE",
  LOCATION_UPDATE: "LOCATION_UPDATE",
  LOCATION_DELETE: "LOCATION_DELETE",
  LOCATION_STATUS_UPDATE: "LOCATION_STATUS_UPDATE",

  PRODUCT_VIEW: "PRODUCT_VIEW",
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  PRODUCT_STATUS_UPDATE: "PRODUCT_STATUS_UPDATE",
};

// ==========================================================
// SYSTEM ROLES
// ==========================================================

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  QUALITY_MANAGER: "QUALITY_MANAGER",
  QUALITY_ENGINEER: "QUALITY_ENGINEER",
  AUDITOR: "AUDITOR",
  EMPLOYEE: "EMPLOYEE",
  VIEWER: "VIEWER",
};

// ==========================================================
// ROLE LIST
// ==========================================================

export const ROLE_LIST = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.QUALITY_MANAGER,
  ROLES.QUALITY_ENGINEER,
  ROLES.AUDITOR,
  ROLES.EMPLOYEE,
  ROLES.VIEWER,
];

// ==========================================================
// PERMISSION LIST
// ==========================================================

export const PERMISSION_LIST = Object.values(PERMISSIONS);
