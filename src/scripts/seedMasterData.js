import mongoose from "mongoose";

import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";

import MasterData from "../models/MasterData.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

/* ==========================================================
 * MASTER DATA SEED
 * ========================================================== */

const MASTER_DATA = [
  /* ========================================================
   * QMS SOURCE
   *
   * Reusable across NCR, CAPA, Audit, Complaints, etc.
   * ======================================================== */

  {
    type: "QMS_SOURCE",
    code: "EXTERNAL_AUDIT",
    name: "External Audit",
    description: "Issue or finding identified during an external audit.",
    sortOrder: 1,
  },

  {
    type: "QMS_SOURCE",
    code: "CUSTOMER_COMPLAINT",
    name: "Customer Complaint",
    description: "Issue reported through a customer complaint.",
    sortOrder: 2,
  },

  {
    type: "QMS_SOURCE",
    code: "INTERNAL_AUDIT",
    name: "Internal Audit",
    description: "Issue or finding identified during an internal audit.",
    sortOrder: 3,
  },

  {
    type: "QMS_SOURCE",
    code: "EMPLOYEE",
    name: "Employee",
    description: "Issue reported by an employee.",
    sortOrder: 4,
  },

  {
    type: "QMS_SOURCE",
    code: "SUPPLIER",
    name: "Supplier",
    description: "Issue identified or reported by a supplier.",
    sortOrder: 5,
  },

  {
    type: "QMS_SOURCE",
    code: "PROCESS",
    name: "Process",
    description: "Issue identified during routine process monitoring.",
    sortOrder: 6,
  },

  {
    type: "QMS_SOURCE",
    code: "MANAGEMENT_REVIEW",
    name: "Management Review",
    description: "Issue identified during management review.",
    sortOrder: 7,
  },

  {
    type: "QMS_SOURCE",
    code: "REGULATORY",
    name: "Regulatory",
    description:
      "Issue originating from regulatory requirements or authorities.",
    sortOrder: 8,
  },

  /* ========================================================
   * QMS SEVERITY
   * ======================================================== */

  {
    type: "QMS_SEVERITY",
    code: "LOW",
    name: "Low",
    description: "Low severity issue.",
    sortOrder: 1,
  },

  {
    type: "QMS_SEVERITY",
    code: "MEDIUM",
    name: "Medium",
    description: "Medium severity issue.",
    sortOrder: 2,
  },

  {
    type: "QMS_SEVERITY",
    code: "HIGH",
    name: "High",
    description: "High severity issue.",
    sortOrder: 3,
  },

  {
    type: "QMS_SEVERITY",
    code: "CRITICAL",
    name: "Critical",
    description: "Critical severity issue requiring immediate attention.",
    sortOrder: 4,
  },

  /* ========================================================
   * QMS CATEGORY
   *
   * Reusable by NCR and CAPA.
   * ======================================================== */

  {
    type: "QMS_CATEGORY",
    code: "PRODUCT",
    name: "Product",
    description: "Product-related quality issue.",
    sortOrder: 1,
  },

  {
    type: "QMS_CATEGORY",
    code: "PROCESS",
    name: "Process",
    description: "Process-related quality issue.",
    sortOrder: 2,
  },

  {
    type: "QMS_CATEGORY",
    code: "SYSTEM",
    name: "System",
    description: "Quality management system related issue.",
    sortOrder: 3,
  },

  {
    type: "QMS_CATEGORY",
    code: "DOCUMENTATION",
    name: "Documentation",
    description: "Documentation-related issue.",
    sortOrder: 4,
  },

  {
    type: "QMS_CATEGORY",
    code: "COMPLIANCE",
    name: "Compliance",
    description: "Compliance-related issue.",
    sortOrder: 5,
  },

  /* ========================================================
   * QMS STATUS
   *
   * Reusable across CAPA, NCR and other QMS modules.
   * ======================================================== */

  {
    type: "QMS_STATUS",
    code: "OPEN",
    name: "Open",
    description: "Record has been opened and requires action.",
    sortOrder: 1,
  },

  {
    type: "QMS_STATUS",
    code: "PENDING",
    name: "Pending",
    description: "Record is pending action, review or information.",
    sortOrder: 2,
  },

  {
    type: "QMS_STATUS",
    code: "IN_PROGRESS",
    name: "In Progress",
    description: "Record is currently being worked on.",
    sortOrder: 3,
  },

  {
    type: "QMS_STATUS",
    code: "UNDER_REVIEW",
    name: "Under Review",
    description: "Record is currently under review.",
    sortOrder: 4,
  },

  {
    type: "QMS_STATUS",
    code: "ON_HOLD",
    name: "On Hold",
    description: "Record is temporarily placed on hold.",
    sortOrder: 5,
  },

  {
    type: "QMS_STATUS",
    code: "CLOSED",
    name: "Closed",
    description: "Record has been completed and closed.",
    sortOrder: 6,
  },

  /* ========================================================
   * ROOT CAUSE CATEGORY
   * ======================================================== */

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "PEOPLE",
    name: "People",
    description: "Root cause related to people, skills or competency.",
    sortOrder: 1,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "PROCESS",
    name: "Process",
    description: "Root cause related to process or procedure.",
    sortOrder: 2,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "EQUIPMENT",
    name: "Equipment",
    description: "Root cause related to equipment or machinery.",
    sortOrder: 3,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "MATERIAL",
    name: "Material",
    description: "Root cause related to material.",
    sortOrder: 4,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "METHOD",
    name: "Method",
    description: "Root cause related to methods or procedures.",
    sortOrder: 5,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "ENVIRONMENT",
    name: "Environment",
    description: "Root cause related to environmental conditions.",
    sortOrder: 6,
  },

  {
    type: "ROOT_CAUSE_CATEGORY",
    code: "MANAGEMENT",
    name: "Management",
    description: "Root cause related to management or organizational controls.",
    sortOrder: 7,
  },

  /* ========================================================
   * AUDIT TYPE
   * ======================================================== */

  {
    type: "AUDIT_TYPE",
    code: "INTERNAL",
    name: "Internal Audit",
    description: "Internal quality or compliance audit.",
    sortOrder: 1,
  },

  {
    type: "AUDIT_TYPE",
    code: "EXTERNAL",
    name: "External Audit",
    description: "External audit performed by an outside party.",
    sortOrder: 2,
  },

  {
    type: "AUDIT_TYPE",
    code: "CUSTOMER",
    name: "Customer Audit",
    description: "Audit performed by or on behalf of a customer.",
    sortOrder: 3,
  },

  {
    type: "AUDIT_TYPE",
    code: "SUPPLIER",
    name: "Supplier Audit",
    description: "Audit performed on a supplier.",
    sortOrder: 4,
  },

  {
    type: "AUDIT_TYPE",
    code: "REGULATORY",
    name: "Regulatory Audit",
    description: "Audit performed for regulatory compliance.",
    sortOrder: 5,
  },

  /* ========================================================
   * SUPPLIER TYPE
   * ======================================================== */

  {
    type: "SUPPLIER_TYPE",
    code: "RAW_MATERIAL",
    name: "Raw Material Supplier",
    description: "Supplier of raw materials.",
    sortOrder: 1,
  },

  {
    type: "SUPPLIER_TYPE",
    code: "COMPONENT",
    name: "Component Supplier",
    description: "Supplier of components.",
    sortOrder: 2,
  },

  {
    type: "SUPPLIER_TYPE",
    code: "SERVICE",
    name: "Service Provider",
    description: "External service provider.",
    sortOrder: 3,
  },

  {
    type: "SUPPLIER_TYPE",
    code: "EQUIPMENT",
    name: "Equipment Supplier",
    description: "Supplier of equipment or machinery.",
    sortOrder: 4,
  },

  /* ========================================================
   * DOCUMENT TYPE
   * ======================================================== */

  {
    type: "DOCUMENT_TYPE",
    code: "POLICY",
    name: "Policy",
    description: "Quality or organizational policy.",
    sortOrder: 1,
  },

  {
    type: "DOCUMENT_TYPE",
    code: "PROCEDURE",
    name: "Procedure",
    description: "Controlled procedure.",
    sortOrder: 2,
  },

  {
    type: "DOCUMENT_TYPE",
    code: "WORK_INSTRUCTION",
    name: "Work Instruction",
    description: "Detailed work instruction.",
    sortOrder: 3,
  },

  {
    type: "DOCUMENT_TYPE",
    code: "FORM",
    name: "Form",
    description: "Controlled form or template.",
    sortOrder: 4,
  },

  {
    type: "DOCUMENT_TYPE",
    code: "RECORD",
    name: "Record",
    description: "Quality or compliance record.",
    sortOrder: 5,
  },

  /* ========================================================
   * TRAINING TYPE
   * ======================================================== */

  {
    type: "TRAINING_TYPE",
    code: "INDUCTION",
    name: "Induction Training",
    description: "Training provided during employee induction.",
    sortOrder: 1,
  },

  {
    type: "TRAINING_TYPE",
    code: "JOB_SPECIFIC",
    name: "Job Specific Training",
    description: "Training required for a specific job role.",
    sortOrder: 2,
  },

  {
    type: "TRAINING_TYPE",
    code: "REFRESHER",
    name: "Refresher Training",
    description: "Periodic refresher training.",
    sortOrder: 3,
  },

  {
    type: "TRAINING_TYPE",
    code: "COMPLIANCE",
    name: "Compliance Training",
    description:
      "Training required for regulatory or organizational compliance.",
    sortOrder: 4,
  },

  /* ========================================================
   * DEPARTMENT
   * ======================================================== */

  {
    type: "DEPARTMENT",
    code: "QUALITY",
    name: "Quality",
    description: "Quality department.",
    sortOrder: 1,
  },

  {
    type: "DEPARTMENT",
    code: "PRODUCTION",
    name: "Production",
    description: "Production department.",
    sortOrder: 2,
  },

  {
    type: "DEPARTMENT",
    code: "ENGINEERING",
    name: "Engineering",
    description: "Engineering department.",
    sortOrder: 3,
  },

  {
    type: "DEPARTMENT",
    code: "PURCHASE",
    name: "Purchase",
    description: "Purchase department.",
    sortOrder: 4,
  },

  {
    type: "DEPARTMENT",
    code: "HR",
    name: "Human Resources",
    description: "Human resources department.",
    sortOrder: 5,
  },

  {
    type: "DEPARTMENT",
    code: "MAINTENANCE",
    name: "Maintenance",
    description: "Maintenance department.",
    sortOrder: 6,
  },

  {
    type: "DEPARTMENT",
    code: "STORES",
    name: "Stores",
    description: "Stores and inventory department.",
    sortOrder: 7,
  },

  {
    type: "DEPARTMENT",
    code: "IT",
    name: "Information Technology",
    description: "Information technology department.",
    sortOrder: 8,
  },

  /* ========================================================
   * PROCESS
   * ======================================================== */

  {
    type: "PROCESS",
    code: "PURCHASING",
    name: "Purchasing",
    description: "Purchasing and procurement process.",
    sortOrder: 1,
  },

  {
    type: "PROCESS",
    code: "PRODUCTION",
    name: "Production",
    description: "Production process.",
    sortOrder: 2,
  },

  {
    type: "PROCESS",
    code: "QUALITY_CONTROL",
    name: "Quality Control",
    description: "Quality control process.",
    sortOrder: 3,
  },

  {
    type: "PROCESS",
    code: "QUALITY_ASSURANCE",
    name: "Quality Assurance",
    description: "Quality assurance process.",
    sortOrder: 4,
  },

  {
    type: "PROCESS",
    code: "MAINTENANCE",
    name: "Maintenance",
    description: "Equipment and maintenance process.",
    sortOrder: 5,
  },

  {
    type: "PROCESS",
    code: "TRAINING",
    name: "Training",
    description: "Employee training and competency process.",
    sortOrder: 6,
  },

  {
    type: "PROCESS",
    code: "DOCUMENT_CONTROL",
    name: "Document Control",
    description: "Document creation, approval and control process.",
    sortOrder: 7,
  },

  /* ========================================================
   * UNIT OF MEASURE
   * ======================================================== */

  {
    type: "UOM",
    code: "PCS",
    name: "Pieces",
    description: "Unit representing individual pieces.",
    sortOrder: 1,
  },

  {
    type: "UOM",
    code: "KG",
    name: "Kilogram",
    description: "Unit of mass.",
    sortOrder: 2,
  },

  {
    type: "UOM",
    code: "G",
    name: "Gram",
    description: "Unit of mass.",
    sortOrder: 3,
  },

  {
    type: "UOM",
    code: "L",
    name: "Liter",
    description: "Unit of volume.",
    sortOrder: 4,
  },

  {
    type: "UOM",
    code: "ML",
    name: "Milliliter",
    description: "Unit of volume.",
    sortOrder: 5,
  },

  {
    type: "UOM",
    code: "M",
    name: "Meter",
    description: "Unit of length.",
    sortOrder: 6,
  },

  {
    type: "UOM",
    code: "MM",
    name: "Millimeter",
    description: "Unit of length.",
    sortOrder: 7,
  },

  {
    type: "UOM",
    code: "HR",
    name: "Hour",
    description: "Unit of time.",
    sortOrder: 8,
  },

  {
    type: "UOM",
    code: "DAY",
    name: "Day",
    description: "Unit of time.",
    sortOrder: 9,
  },
];

/* ==========================================================
 * SEED
 * ========================================================== */

const seedMasterData = async () => {
  try {
    await connectDB();

    console.log("MongoDB connected successfully.");

    /*
     * MASTER DATA IS SYSTEM DATA
     *
     * organizationId = null
     * isSystem = true
     *
     * These records are therefore available
     * to all organizations.
     */

    for (const item of MASTER_DATA) {
      const record = await MasterData.findOneAndUpdate(
        {
          type: item.type,
          organizationId: null,
          code: item.code,
        },
        {
          $set: {
            type: item.type,
            code: item.code,
            name: item.name,
            description: item.description || "",
            organizationId: null,
            isSystem: true,
            isActive: true,
            sortOrder: item.sortOrder ?? 0,
            metadata: item.metadata || {},
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        },
      );

      console.log(`Master data ready: ${record.type} - ${record.code}`);
    }

    /* ========================================================
     * SUPER ADMIN MASTER DATA PERMISSIONS
     *
     * Role.permissions stores Permission ObjectIds.
     * It must NOT contain permission key strings.
     * ======================================================== */

    const masterDataPermissionKeys = [
      "MASTER_DATA_VIEW",
      "MASTER_DATA_CREATE",
      "MASTER_DATA_UPDATE",
      "MASTER_DATA_DELETE",
      "MASTER_DATA_STATUS_UPDATE",
    ];

    const superAdminRole = await Role.findOne({
      name: "SUPER_ADMIN",
    });

    if (superAdminRole) {
      /*
       * Find the actual Permission documents using
       * their permission keys.
       */
      const masterDataPermissionDocuments = await Permission.find({
        key: {
          $in: masterDataPermissionKeys,
        },
      }).select("_id key");

      /*
       * Determine which expected permissions exist.
       */
      const foundPermissionKeys = new Set(
        masterDataPermissionDocuments.map((permission) =>
          String(permission.key).toUpperCase(),
        ),
      );

      /*
       * Warn about missing permissions instead of
       * silently failing.
       */
      const missingPermissionKeys = masterDataPermissionKeys.filter(
        (key) => !foundPermissionKeys.has(key.toUpperCase()),
      );

      if (missingPermissionKeys.length > 0) {
        console.warn(
          "The following Master Data permissions were not found:",
          missingPermissionKeys,
        );
      }

      /*
       * Existing permissions are ObjectIds.
       * Convert them to strings temporarily so
       * duplicate checking is reliable.
       */
      const existingPermissionIds = Array.isArray(superAdminRole.permissions)
        ? superAdminRole.permissions
            .filter(Boolean)
            .map((permission) => permission.toString())
        : [];

      /*
       * Get the ObjectIds of the Master Data permissions.
       */
      const newPermissionIds = masterDataPermissionDocuments.map((permission) =>
        permission._id.toString(),
      );

      /*
       * Merge existing permissions with the new
       * Master Data permissions without duplicates.
       */
      const mergedPermissionIds = [
        ...new Set([...existingPermissionIds, ...newPermissionIds]),
      ];

      /*
       * Role.permissions expects ObjectIds.
       */
      superAdminRole.permissions = mergedPermissionIds.map(
        (permissionId) => new mongoose.Types.ObjectId(permissionId),
      );

      await superAdminRole.save();

      console.log(
        `MASTER_DATA permissions attached to SUPER_ADMIN. ` +
          `${newPermissionIds.length} permission(s) processed.`,
      );
    } else {
      console.warn(
        "SUPER_ADMIN role not found. Permissions were not attached.",
      );
    }

    console.log(
      `Master Data seed completed. ${MASTER_DATA.length} records processed.`,
    );
  } catch (error) {
    console.error("Master Data seed failed:", error);

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedMasterData();
