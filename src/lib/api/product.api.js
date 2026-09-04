import api from "./axios";

const unwrap = (response) => {
  return response?.data?.data ?? response?.data;
};

const unwrapProduct = (response) => {
  const data = unwrap(response);

  return data?.product || data?.record || data?.item || data;
};

// ==========================================================
// GET PRODUCTS
// ==========================================================

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", {
    params,
  });

  const data = response?.data?.data || {};

  return {
    data: Array.isArray(data) ? data : data?.products || [],

    pagination: response?.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };
};

// ==========================================================
// GET SINGLE PRODUCT
// ==========================================================

export const getProductById = async (productId, params = {}) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  return unwrapProduct(
    await api.get("/products", {
      params: {
        ...params,
        productId,
      },
    }),
  );
};

// ==========================================================
// CREATE PRODUCT
// ==========================================================

export const createProduct = async (data = {}) => {
  return unwrapProduct(await api.post("/products", data));
};

// ==========================================================
// UPDATE PRODUCT
// ==========================================================

export const updateProduct = async (productId, data = {}) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  return unwrapProduct(
    await api.patch("/products", {
      ...data,
      productId,
    }),
  );
};

// ==========================================================
// UPDATE PRODUCT STATUS
// ==========================================================

export const updateProductStatus = async (productId, isActive) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (typeof isActive !== "boolean") {
    throw new Error("isActive must be a boolean.");
  }

  return unwrapProduct(
    await api.patch("/products", {
      productId,
      action: "STATUS",
      isActive,
    }),
  );
};

// ==========================================================
// DELETE PRODUCT
// ==========================================================

export const deleteProduct = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  return unwrap(
    await api.delete("/products", {
      params: {
        productId,
      },
    }),
  );
};
