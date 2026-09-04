import mongoose from "mongoose";

import Product from "@/models/Product.js";
import MasterData from "@/models/MasterData.js";
import Organization from "@/models/Organization.js";

import { createAuditLog } from "@/services/auditLog/auditLog.service.js";

// ==========================================================
// CONSTANTS
// ==========================================================

const MASTER_REFERENCE_TYPES = {
  categoryId: "PRODUCT_CATEGORY",
  uomId: "UOM",
  brandId: "BRAND",
  productTypeId: "PRODUCT_TYPE",
};

const PRODUCT_MODULE = "PRODUCT";

// ==========================================================
// ERROR HELPER
// ==========================================================

const createError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

// ==========================================================
// ID HELPERS
// ==========================================================

const idOf = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  if (typeof value === "object" && value.id) {
    return value.id;
  }

  return value;
};

const normalizeText = (value) => {
  return String(value ?? "").trim();
};

const normalizeCode = (value) => {
  return normalizeText(value).toUpperCase();
};

const ensureObjectId = (value, label = "ID") => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw createError(`Invalid ${label}.`, 400);
  }

  return new mongoose.Types.ObjectId(value);
};

// ==========================================================
// SUPER ADMIN
// ==========================================================

const isSuperAdmin = (user) => {
  return (
    String(user?.role || "")
      .trim()
      .toUpperCase() === "SUPER_ADMIN"
  );
};

// ==========================================================
// USER ORGANIZATION
// ==========================================================

const getUserOrganizationId = (user) => {
  return user?.organizationId?._id || user?.organizationId || null;
};

// ==========================================================
// RESOLVE USER ORGANIZATION
// ==========================================================

const resolveOrganizationId = (user) => {
  if (isSuperAdmin(user)) {
    return null;
  }

  const organizationId = getUserOrganizationId(user);

  if (!organizationId) {
    throw createError("User is not associated with an organization.", 403);
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw createError("Invalid organization.", 403);
  }

  return new mongoose.Types.ObjectId(organizationId);
};

// ==========================================================
// ENSURE ORGANIZATION EXISTS
// ==========================================================

const ensureOrganizationExists = async (organizationId) => {
  if (!organizationId) {
    throw createError("Organization ID is required.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw createError("Invalid organization ID.", 400);
  }

  const organization =
    await Organization.findById(organizationId).select("_id name status");

  if (!organization) {
    throw createError("Organization not found.", 404);
  }

  if (organization.status && organization.status !== "ACTIVE") {
    throw createError("Selected organization is not active.", 400);
  }

  return organization;
};

// ==========================================================
// RESOLVE PRODUCT SCOPE
//
// SUPER_ADMIN:
//   isSystem = true
//      organizationId = null
//
//   isSystem = false
//      organizationId = selected organization
//
// ORGANIZATION USER:
//   organizationId = authenticated organization
//   isSystem = false
// ==========================================================

const resolveProductScope = async (user, data = {}) => {
  // --------------------------------------------------------
  // ORGANIZATION USER
  // --------------------------------------------------------

  if (!isSuperAdmin(user)) {
    return {
      organizationId: resolveOrganizationId(user),

      isSystem: false,
    };
  }

  // --------------------------------------------------------
  // SUPER ADMIN
  // --------------------------------------------------------

  const systemRequested = data.isSystem === true || data.isSystem === "true";

  if (systemRequested) {
    return {
      organizationId: null,
      isSystem: true,
    };
  }

  const organizationId = data.organizationId || null;

  if (!organizationId) {
    throw createError(
      "Organization is required unless Use System is enabled.",
      400,
    );
  }

  const organization = await ensureOrganizationExists(organizationId);

  return {
    organizationId: organization._id,

    isSystem: false,
  };
};

// ==========================================================
// BUILD ACCESS SCOPE
//
// SUPER_ADMIN can see/manage:
//
//   - System products
//   - Organization products from every organization
//
// Organization users can only see/manage:
//
//   - Products belonging to their organization
// ==========================================================

// const buildScope = (user) => {
//   if (isSuperAdmin(user)) {
//     return {};
//   }

//   const organizationId = resolveOrganizationId(user);

//   return {
//     organizationId,
//     isSystem: false,
//   };
// };
const buildScope = (user) => {
  if (isSuperAdmin(user)) {
    return {};
  }

  const organizationId = resolveOrganizationId(user);

  return {
    $and: [
      {
        $or: [
          {
            organizationId,
            isSystem: false,
          },
          {
            organizationId: null,
            isSystem: true,
          },
        ],
      },
    ],
  };
};

// ==========================================================
// MASTER DATA VALIDATION
// ==========================================================

const validateMasterReference = async ({ user, value, field }) => {
  if (!value) {
    return null;
  }

  const type = MASTER_REFERENCE_TYPES[field];

  if (!type) {
    throw createError(`Unsupported master reference: ${field}.`, 400);
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createError(`Invalid ${field}.`, 400);
  }

  const objectId = new mongoose.Types.ObjectId(value);

  /*
   * SUPER_ADMIN can use system/global
   * master data.
   *
   * Organization users can use:
   *
   *   1. Their organization's master data
   *   2. System/global master data
   */

  let query;

  if (isSuperAdmin(user)) {
    query = {
      _id: objectId,
      type,
      isActive: true,
      organizationId: null,
    };
  } else {
    const organizationId = resolveOrganizationId(user);

    query = {
      _id: objectId,
      type,
      isActive: true,
      $or: [
        {
          organizationId,
        },
        {
          organizationId: null,
        },
      ],
    };
  }

  const master = await MasterData.findOne(query)
    .select("_id type code name organizationId isSystem isActive")
    .lean();

  if (!master) {
    throw createError(
      `${type} master data is invalid, inactive, or not available for this user.`,
      400,
    );
  }

  return master;
};

// ==========================================================
// VALIDATE PRODUCT MASTER REFERENCES
// ==========================================================

const validateProductMasters = async (user, data = {}) => {
  const [category, uom, brand, productType] = await Promise.all([
    validateMasterReference({
      user,
      value: data.categoryId,
      field: "categoryId",
    }),

    validateMasterReference({
      user,
      value: data.uomId,
      field: "uomId",
    }),

    validateMasterReference({
      user,
      value: data.brandId,
      field: "brandId",
    }),

    validateMasterReference({
      user,
      value: data.productTypeId,
      field: "productTypeId",
    }),
  ]);

  if (!uom) {
    throw createError("UOM is required.", 400);
  }

  return {
    category,
    uom,
    brand,
    productType,
  };
};

// ==========================================================
// UOM HELPERS
// ==========================================================

const isPieceUom = (uom) => {
  if (!uom) {
    return false;
  }

  const name = normalizeText(uom.name).toLowerCase();

  const code = normalizeText(uom.code).toLowerCase();

  return (
    ["piece", "pieces", "pc", "pcs"].includes(name) ||
    ["piece", "pieces", "pc", "pcs"].includes(code)
  );
};

// ==========================================================
// NORMALIZE QUANTITY
// ==========================================================

const normalizeQuantity = (value, uom) => {
  if (value === undefined || value === null || value === "") {
    return 1;
  }

  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    throw createError("Quantity must be a valid number.", 400);
  }

  if (quantity < 0) {
    throw createError("Quantity cannot be negative.", 400);
  }

  /*
   * Pieces are still stored as Number.
   *
   * We intentionally do not force integer here
   * because existing products may contain decimal
   * quantities and the Product schema allows Number.
   *
   * UI can still present Pieces appropriately.
   */

  if (isPieceUom(uom)) {
    return quantity;
  }

  return quantity;
};

// ==========================================================
// AUDIT
// ==========================================================

const auditProductAction = async ({
  action,
  product = null,
  oldData = null,
  newData = null,
  user = null,
  description = "",
}) => {
  try {
    await createAuditLog({
      organizationId:
        product?.organizationId?._id || product?.organizationId || null,

      userId: idOf(user),

      userName:
        user?.name ||
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "",

      userEmail: user?.email || "",

      action,

      module: PRODUCT_MODULE,

      recordId: product?._id || product?.id || null,

      description,

      oldData,

      newData,

      ipAddress: user?.ipAddress || user?.ip || "",

      userAgent: user?.userAgent || "",
    });
  } catch (auditError) {
    /*
     * Audit must never make the main Product
     * operation fail.
     */

    console.error("Product audit log error:", auditError);
  }
};

// ==========================================================
// SERIALIZE PRODUCT
// ==========================================================

const serializeProduct = (product) => {
  if (!product) {
    return null;
  }

  return {
    ...product,

    id: product._id || product.id || null,

    organizationId:
      product.organizationId?._id || product.organizationId || null,

    isSystem:
      product.isSystem === true ||
      (!product.organizationId && product.isSystem !== false),

    quantity: product.quantity == null ? 1 : Number(product.quantity),
  };
};

// ==========================================================
// POPULATE PRODUCT
// ==========================================================

const populateProduct = (query) => {
  return query
    .populate({
      path: "organizationId",
      select: "_id name code email status plan",
    })

    .populate({
      path: "categoryId",
      select:
        "_id type code name description organizationId isSystem isActive sortOrder",
    })

    .populate({
      path: "uomId",
      select:
        "_id type code name description organizationId isSystem isActive sortOrder",
    })

    .populate({
      path: "brandId",
      select:
        "_id type code name description organizationId isSystem isActive sortOrder",
    })

    .populate({
      path: "productTypeId",
      select:
        "_id type code name description organizationId isSystem isActive sortOrder",
    })

    .populate({
      path: "createdBy",
      select: "_id firstName lastName email role",
    })

    .populate({
      path: "updatedBy",
      select: "_id firstName lastName email role",
    });
};

// ==========================================================
// DECORATE PRODUCT
// ==========================================================

const decorateProduct = (product) => {
  if (!product) {
    return null;
  }

  const serialized = serializeProduct(product);

  return {
    ...serialized,

    organization: product.organizationId || null,

    categoryMaster: product.categoryId || null,

    uom: product.uomId || null,

    brand: product.brandId || null,

    productType: product.productTypeId || null,
  };
};

// ==========================================================
// LIST PRODUCTS
// ==========================================================

export const listProducts = async (
  user,
  {
    page = 1,
    limit = 20,
    search = "",
    status = "",
    categoryId = "",
    brandId = "",
    productTypeId = "",
    organizationId = "",
    scope = "",
  } = {},
) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (currentPage - 1) * currentLimit;

  const query = {
    ...buildScope(user),
  };

  // --------------------------------------------------------
  // SUPER ADMIN ORGANIZATION FILTER
  // --------------------------------------------------------

  if (isSuperAdmin(user) && organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw createError("Invalid organization filter.", 400);
    }

    await ensureOrganizationExists(organizationId);

    query.organizationId = new mongoose.Types.ObjectId(organizationId);

    query.isSystem = false;
  }

  // --------------------------------------------------------
  // SUPER ADMIN SCOPE FILTER
  // --------------------------------------------------------

  if (isSuperAdmin(user) && scope) {
    const normalizedScope = String(scope).trim().toUpperCase();

    if (normalizedScope === "SYSTEM") {
      query.organizationId = null;
      query.isSystem = true;
    }

    if (normalizedScope === "ORGANIZATION") {
      query.isSystem = false;

      /*
       * If no organizationId is supplied,
       * all organization products are returned.
       */
    }

    if (!["SYSTEM", "ORGANIZATION", "ALL"].includes(normalizedScope)) {
      throw createError("Invalid product scope.", 400);
    }
  }

  // --------------------------------------------------------
  // STATUS
  // --------------------------------------------------------

  if (status !== "" && status !== undefined && status !== null) {
    if (
      status === true ||
      status === "true" ||
      String(status).toUpperCase() === "ACTIVE"
    ) {
      query.isActive = true;
    } else if (
      status === false ||
      status === "false" ||
      String(status).toUpperCase() === "INACTIVE"
    ) {
      query.isActive = false;
    }
  }

  // --------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------

  const trimmedSearch = normalizeText(search);

  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.$or = [
      {
        code: {
          $regex: escapedSearch,
          $options: "i",
        },
      },

      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },

      {
        modelNumber: {
          $regex: escapedSearch,
          $options: "i",
        },
      },

      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },

      {
        category: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  // --------------------------------------------------------
  // CATEGORY FILTER
  // --------------------------------------------------------

  if (categoryId) {
    query.categoryId = ensureObjectId(categoryId, "Category ID");
  }

  // --------------------------------------------------------
  // BRAND FILTER
  // --------------------------------------------------------

  if (brandId) {
    query.brandId = ensureObjectId(brandId, "Brand ID");
  }

  // --------------------------------------------------------
  // PRODUCT TYPE FILTER
  // --------------------------------------------------------

  if (productTypeId) {
    query.productTypeId = ensureObjectId(productTypeId, "Product Type ID");
  }

  // --------------------------------------------------------
  // DATABASE QUERY
  // --------------------------------------------------------

  const productsQuery = Product.find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(currentLimit)
    .lean();

  const populatedQuery = populateProduct(productsQuery);

  /*
   * IMPORTANT:
   *
   * populateProduct() returns a Mongoose Query.
   * Do not call .exec() on the Product document
   * after awaiting it.
   *
   * This fixes the previous:
   *
   *   products.exec is not a function
   *
   * error.
   */

  const rawProducts = await populatedQuery.exec();

  const total = await Product.countDocuments(query);

  const products = rawProducts.map(decorateProduct);

  const totalPages = Math.ceil(total / currentLimit);

  return {
    products,

    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages,

      hasPreviousPage: currentPage > 1,

      hasNextPage: currentPage < totalPages,
    },
  };
};

// ==========================================================
// GET PRODUCT BY ID
// ==========================================================

export const getProductById = async (user, productId) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const objectId = ensureObjectId(productId, "Product ID");

  const scope = buildScope(user);

  const query = {
    ...scope,
    _id: objectId,
  };

  const productQuery = Product.findOne(query).lean();

  const populatedQuery = populateProduct(productQuery);

  const product = await populatedQuery.exec();

  if (!product) {
    throw createError("Product not found.", 404);
  }

  return decorateProduct(product);
};

// ==========================================================
// CREATE PRODUCT
// ==========================================================

export const createProduct = async (user, data = {}) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  // --------------------------------------------------------
  // RESOLVE PRODUCT SCOPE
  // --------------------------------------------------------

  const productScope = await resolveProductScope(user, data);

  // --------------------------------------------------------
  // NORMALIZE
  // --------------------------------------------------------

  const code = normalizeCode(data.code);

  const name = normalizeText(data.name);

  const modelNumber = normalizeText(data.modelNumber);

  const description = normalizeText(data.description);

  // --------------------------------------------------------
  // REQUIRED
  // --------------------------------------------------------

  if (!code) {
    throw createError("Product code is required.", 400);
  }

  if (!name) {
    throw createError("Product name is required.", 400);
  }

  if (!data.uomId) {
    throw createError("UOM is required.", 400);
  }

  // --------------------------------------------------------
  // MASTER REFERENCES
  // --------------------------------------------------------

  const masters = await validateProductMasters(user, data);

  // --------------------------------------------------------
  // QUANTITY
  // --------------------------------------------------------

  const quantity = normalizeQuantity(data.quantity, masters.uom);

  // --------------------------------------------------------
  // DUPLICATE
  // --------------------------------------------------------

  const duplicate = await Product.findOne({
    organizationId: productScope.organizationId,

    code,
  })
    .select("_id")
    .lean();

  if (duplicate) {
    throw createError("A product with this code already exists.", 409);
  }

  // --------------------------------------------------------
  // CREATE
  // --------------------------------------------------------

  const product = await Product.create({
    organizationId: productScope.organizationId,

    isSystem: productScope.isSystem,

    code,

    name,

    modelNumber,

    description,

    categoryId: masters.category?._id || null,

    uomId: masters.uom?._id || null,

    brandId: masters.brand?._id || null,

    productTypeId: masters.productType?._id || null,

    // Legacy category support.
    category: normalizeText(data.category),

    quantity,

    isActive: data.isActive === undefined ? true : Boolean(data.isActive),

    createdBy: idOf(user),

    updatedBy: idOf(user),
  });

  // --------------------------------------------------------
  // RETURN POPULATED PRODUCT
  // --------------------------------------------------------

  const productQuery = Product.findById(product._id).lean();

  const populatedQuery = populateProduct(productQuery);

  const populatedProduct = await populatedQuery.exec();

  // --------------------------------------------------------
  // AUDIT
  // --------------------------------------------------------

  await auditProductAction({
    action: "CREATE",

    product: populatedProduct,

    oldData: null,

    newData: populatedProduct,

    user,

    description: productScope.isSystem
      ? `Created system product ${code}.`
      : `Created organization product ${code}.`,
  });

  return decorateProduct(populatedProduct);
};

// ==========================================================
// UPDATE PRODUCT
// ==========================================================

export const updateProduct = async (user, productId, data = {}) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const objectId = ensureObjectId(productId, "Product ID");

  // --------------------------------------------------------
  // FIND EXISTING PRODUCT
  // --------------------------------------------------------

  const scope = buildScope(user);

  const existing = await Product.findOne({
    ...scope,
    _id: objectId,
  });

  if (!existing) {
    throw createError("Product not found.", 404);
  }

  // --------------------------------------------------------
  // OLD DATA
  // --------------------------------------------------------

  const oldData = existing.toObject();

  // --------------------------------------------------------
  // RESOLVE TARGET SCOPE
  // --------------------------------------------------------

  /*
   * SUPER_ADMIN can change:
   *
   * System -> Organization
   * Organization -> System
   * Organization A -> Organization B
   *
   * Normal organization users remain locked
   * to their authenticated organization.
   */

  const targetScope = await resolveProductScope(user, {
    ...data,

    /*
     * If SUPER_ADMIN is editing an existing
     * product and the form did not explicitly
     * send organization/system information,
     * preserve the current scope.
     */
    ...(isSuperAdmin(user) &&
    data.organizationId === undefined &&
    data.isSystem === undefined
      ? {
          organizationId: existing.organizationId,

          isSystem: existing.isSystem === true || !existing.organizationId,
        }
      : {}),
  });

  // --------------------------------------------------------
  // NORMALIZE
  // --------------------------------------------------------

  const code =
    data.code !== undefined ? normalizeCode(data.code) : existing.code;

  const name =
    data.name !== undefined ? normalizeText(data.name) : existing.name;

  const modelNumber =
    data.modelNumber !== undefined
      ? normalizeText(data.modelNumber)
      : existing.modelNumber;

  const description =
    data.description !== undefined
      ? normalizeText(data.description)
      : existing.description;

  // --------------------------------------------------------
  // REQUIRED
  // --------------------------------------------------------

  if (!code) {
    throw createError("Product code is required.", 400);
  }

  if (!name) {
    throw createError("Product name is required.", 400);
  }

  // --------------------------------------------------------
  // MASTER DATA
  // --------------------------------------------------------

  const masterData = {
    categoryId:
      data.categoryId !== undefined ? data.categoryId : existing.categoryId,

    uomId: data.uomId !== undefined ? data.uomId : existing.uomId,

    brandId: data.brandId !== undefined ? data.brandId : existing.brandId,

    productTypeId:
      data.productTypeId !== undefined
        ? data.productTypeId
        : existing.productTypeId,
  };

  const masters = await validateProductMasters(user, masterData);

  // --------------------------------------------------------
  // QUANTITY
  // --------------------------------------------------------

  const quantity = normalizeQuantity(
    data.quantity !== undefined ? data.quantity : existing.quantity,
    masters.uom,
  );

  // --------------------------------------------------------
  // DUPLICATE PRODUCT CODE
  //
  // Code uniqueness is per organization/system scope.
  // --------------------------------------------------------

  const duplicate = await Product.findOne({
    organizationId: targetScope.organizationId,

    code,

    _id: {
      $ne: objectId,
    },
  })
    .select("_id")
    .lean();

  if (duplicate) {
    throw createError(
      "A product with this code already exists in the selected scope.",
      409,
    );
  }

  // --------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------

  existing.organizationId = targetScope.organizationId;

  existing.isSystem = targetScope.isSystem;

  existing.code = code;

  existing.name = name;

  existing.modelNumber = modelNumber;

  existing.description = description;

  existing.categoryId = masters.category?._id || null;

  existing.uomId = masters.uom?._id || null;

  existing.brandId = masters.brand?._id || null;

  existing.productTypeId = masters.productType?._id || null;

  if (data.category !== undefined) {
    existing.category = normalizeText(data.category);
  }

  existing.quantity = quantity;

  if (data.isActive !== undefined) {
    existing.isActive = Boolean(data.isActive);
  }

  existing.updatedBy = idOf(user);

  await existing.save();

  // --------------------------------------------------------
  // RETURN POPULATED PRODUCT
  // --------------------------------------------------------

  const productQuery = Product.findById(existing._id).lean();

  const populatedQuery = populateProduct(productQuery);

  const populatedProduct = await populatedQuery.exec();

  // --------------------------------------------------------
  // AUDIT
  // --------------------------------------------------------

  await auditProductAction({
    action: "UPDATE",

    product: populatedProduct,

    oldData,

    newData: populatedProduct,

    user,

    description: `Updated product ${code}.`,
  });

  return decorateProduct(populatedProduct);
};

// ==========================================================
// UPDATE PRODUCT STATUS
// ==========================================================

export const updateProductStatus = async (user, productId, isActive) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  if (typeof isActive !== "boolean") {
    throw createError("Product status must be a boolean.", 400);
  }

  const objectId = ensureObjectId(productId, "Product ID");

  const scope = buildScope(user);

  const product = await Product.findOne({
    ...scope,

    _id: objectId,
  });

  if (!product) {
    throw createError("Product not found.", 404);
  }

  const oldData = product.toObject();

  product.isActive = isActive;

  product.updatedBy = idOf(user);

  await product.save();

  const productQuery = Product.findById(product._id).lean();

  const populatedQuery = populateProduct(productQuery);

  const populatedProduct = await populatedQuery.exec();

  await auditProductAction({
    action: isActive ? "ACTIVATE" : "DEACTIVATE",

    product: populatedProduct,

    oldData,

    newData: populatedProduct,

    user,

    description: `Changed product status to ${
      isActive ? "Active" : "Inactive"
    }.`,
  });

  return decorateProduct(populatedProduct);
};

// ==========================================================
// DELETE PRODUCT
// ==========================================================

export const deleteProduct = async (user, productId) => {
  if (!user?.role) {
    throw createError("Authentication required.", 401);
  }

  const objectId = ensureObjectId(productId, "Product ID");

  const scope = buildScope(user);

  const product = await Product.findOne({
    ...scope,

    _id: objectId,
  });

  if (!product) {
    throw createError("Product not found.", 404);
  }

  const oldData = product.toObject();

  await Product.deleteOne({
    _id: objectId,
  });

  await auditProductAction({
    action: "DELETE",

    product,

    oldData,

    newData: null,

    user,

    description: `Deleted product ${product.code}.`,
  });

  return {
    success: true,

    message: "Product deleted successfully.",
  };
};
