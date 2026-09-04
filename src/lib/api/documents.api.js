import api from "./axios";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const getDocuments = async (params = {}) => {
  const response = await api.get("/documents", {
    params,
  });

  return response?.data || {};
};

export const getDocumentById = async (id) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(await api.get(`/documents/${id}`));
};

export const createDocument = async (data) => {
  if (!data) {
    throw new Error("Document data is required.");
  }

  return unwrap(await api.post("/documents", data));
};

export const updateDocument = async (id, data) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(await api.put(`/documents/${id}`, data));
};

export const updateDocumentStatus = async (id, data) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(await api.patch(`/documents/${id}/status`, data));
};

/**
 * Returns the API endpoint used to view a document.
 *
 * IMPORTANT:
 * This is intentionally not an axios request.
 * It returns the browser-accessible API URL.
 */
export const getDocumentViewUrl = (id) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return `/api/documents/${id}/view`;
};

export const deleteDocument = async (id) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(await api.delete(`/documents/${id}`));
};

export const getDocumentAccessToken = async (id) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(await api.post(`/documents/${id}/access-token`));
};

export const getDocumentAuditLogs = async (id, params = {}) => {
  if (!id) {
    throw new Error("Document ID is required.");
  }

  return unwrap(
    await api.get(`/documents/${id}/audit-logs`, {
      params,
    }),
  );
};

export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  updateDocumentStatus,
  getDocumentViewUrl,
  deleteDocument,
  getDocumentAccessToken,
  getDocumentAuditLogs,
};
