
import api from "@/lib/api/axios";

// ==========================================================
// GET AUDIT LOGS
// ==========================================================

export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  search = "",
  module = "",
  action = "",
  userId = "",
  recordId = "",
  startDate = "",
  endDate = "",
  organizationId = "",
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  if (module?.trim()) {
    params.module = module.trim();
  }

  if (action?.trim()) {
    params.action = action.trim();
  }

  if (userId?.trim()) {
    params.userId = userId.trim();
  }

  if (recordId?.trim()) {
    params.recordId = recordId.trim();
  }

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  if (organizationId?.trim()) {
    params.organizationId =
      organizationId.trim();
  }

  return api.get("/auditLog", {
    params,
  });
};

// ==========================================================
// GET SINGLE AUDIT LOG
// ==========================================================

export const getAuditLogById = async (
  auditLogId
) => {
  if (!auditLogId) {
    throw new Error(
      "Audit log ID is required."
    );
  }

  return api.get(
    `/auditLog/${auditLogId}`
  );
};

// ==========================================================
// DEFAULT
// ==========================================================

export default {
  getAuditLogs,
  getAuditLogById,
};

