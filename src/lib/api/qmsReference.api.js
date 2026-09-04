import { getMasterData } from "@/lib/api/masterData.api";
import { getProducts } from "@/lib/api/product.api";
import { getLocations } from "@/lib/api/location.api";

const normalizeType = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const unwrapMaster = (response) =>
  Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
        ? response.items
        : [];

const unwrapProducts = (response) =>
  Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.products)
      ? response.products
      : Array.isArray(response?.data?.products)
        ? response.data.products
        : Array.isArray(response)
          ? response
          : [];

const unwrapLocations = (response) =>
  Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.locations)
      ? response.locations
      : Array.isArray(response?.data?.locations)
        ? response.data.locations
        : Array.isArray(response)
          ? response
          : [];

const appliesToModule = (item, module) => {
  const target = String(module || "")
    .trim()
    .toUpperCase();
  if (!target) return true;

  const metadata = item?.metadata || {};
  const values = [
    metadata.module,
    metadata.modules,
    metadata.applicableTo,
    metadata.applicableModules,
    metadata.entity,
    metadata.entities,
  ].flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []));

  if (values.length) {
    return values.some((value) => {
      const current = String(value).trim().toUpperCase();
      return current === target || current === "ALL" || current === "QMS";
    });
  }

  const code = String(item?.code || "")
    .trim()
    .toUpperCase();
  if (code.startsWith("NCR_")) return target === "NCR";
  if (code.startsWith("CAPA_")) return target === "CAPA";

  return true;
};

export const getQMSReferenceOptions = async (
  type,
  { organizationId = "", module = "" } = {},
) => {
  const normalizedType = normalizeType(type);
  if (!normalizedType) return [];

  if (normalizedType === "PRODUCT") {
    const response = await getProducts({
      page: 1,
      limit: 100,
      isActive: true,
    });
    return unwrapProducts(response).filter((item) => item?.isActive !== false);
  }

  if (normalizedType === "LOCATION") {
    const response = await getLocations({
      type: "COUNTRY",
      isActive: true,
      page: 1,
      limit: 100,
    });
    return unwrapLocations(response).filter((item) => item?.isActive !== false);
  }

  const response = await getMasterData(normalizedType, {
    ...(organizationId ? { organizationId } : {}),
    includeInactive: false,
    page: 1,
    limit: 100,
  });

  return (
    unwrapMaster(response)
      .filter((item) => item?.isActive !== false)
      // Suppliers are shared master references used by NCR/CAPA and should
      // not disappear because a supplier record carries SUPPLIER-module
      // applicability metadata. Other QMS masters remain metadata-driven.
      .filter((item) =>
        normalizedType === "SUPPLIER" ? true : appliesToModule(item, module),
      )
  );
};
