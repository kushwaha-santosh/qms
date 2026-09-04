import api from "./axios";

// ==========================================================
// LIST
// ==========================================================

export const getPageMetadata = async () => {
  const response = await api.get("/pageMetadata");

  return response.data;
};

// ==========================================================
// GET BY KEY
// ==========================================================

export const getPageMetadataByKey = async (pageKey) => {
  const response = await api.get(
    `/pageMetadata/${encodeURIComponent(pageKey)}`,
  );

  return response.data;
};

// ==========================================================
// CREATE
// ==========================================================

export const createPageMetadata = async (payload) => {
  const response = await api.post("/pageMetadata", payload);

  return response.data;
};

// ==========================================================
// UPDATE
// ==========================================================

export const updatePageMetadata = async (pageKey, payload) => {
  const response = await api.put(
    `/pageMetadata/${encodeURIComponent(pageKey)}`,
    payload,
  );

  return response.data;
};

// ==========================================================
// STATUS
// ==========================================================

export const updatePageMetadataStatus = async (pageKey, isActive) => {
  const response = await api.patch(
    `/pageMetadata/${encodeURIComponent(pageKey)}`,
    {
      isActive,
    },
  );

  return response.data;
};

// ==========================================================
// DELETE
// ==========================================================

export const deletePageMetadata = async (pageKey) => {
  const response = await api.delete(
    `/pageMetadata/${encodeURIComponent(pageKey)}`,
  );

  return response.data;
};

// ==========================================================
// PUBLIC / RUNTIME PAGE METADATA
// ==========================================================
//
// Used by PageMetadataManager.
//
// This uses the current URL path instead of a page key.
//

export const getEffectivePageMetadata = async (path) => {
  const response = await api.get("/pageMetadata/effective", {
    params: {
      path,
    },
  });

  return response.data;
};
