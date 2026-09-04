"use client";

import { useEffect, useMemo, useState } from "react";
import { getQMSReferenceOptions } from "@/lib/api/qmsReference.api";

const cache = new Map();

const idOf = (item) => String(item?._id || item?.id || item?.productId || item?.locationId || "");
const labelFor = (item, sourceType) => {
  if (sourceType === "PRODUCT") {
    const code = item?.code || item?.sku || item?.productCode || "";
    const name = item?.name || item?.productName || item?.displayName || "Unnamed Product";
    return code ? `${name} (${code})` : name;
  }

  if (sourceType === "LOCATION") {
    const type = item?.type ? ` — ${String(item.type).replaceAll("_", " ")}` : "";
    const code = item?.code ? ` (${item.code})` : "";
    const name = item?.name || item?.locationName || item?.displayName || "Unnamed Location";
    return `${name}${code}${type}`;
  }

  return item?.name || item?.code || "Unnamed";
};

const valueFor = (item, sourceType) => {
  if (sourceType === "PRODUCT" || sourceType === "LOCATION") return idOf(item);
  const raw = String(item?.code || item?.name || "");
  if (sourceType === "QMS_STATUS") {
    return raw.trim().toUpperCase().replace(/\s+/g, "_");
  }
  return raw;
};

export default function QMSReferenceSelect({
  sourceType,
  name,
  label,
  module = "",
  value = "",
  onChange,
  organizationId = "",
  required = false,
  disabled = false,
  placeholder = "Select",
  className = "",
}) {
  const cacheKey = `${sourceType}|${module || "ALL"}|${organizationId || "CURRENT"}`;
  const [options, setOptions] = useState(() => cache.get(cacheKey)?.data || []);
  const [loading, setLoading] = useState(() => !cache.get(cacheKey));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!sourceType) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    const cached = cache.get(cacheKey);
    if (cached?.data) {
      setOptions(cached.data);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");

    const pending =
      cached?.promise ||
      getQMSReferenceOptions(sourceType, { organizationId, module })
        .then((data) => {
          const normalized = Array.isArray(data) ? data.filter(Boolean) : [];
          cache.set(cacheKey, { data: normalized });
          return normalized;
        })
        .catch((requestError) => {
          cache.delete(cacheKey);
          throw requestError;
        });

    cache.set(cacheKey, { promise: pending });

    pending
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setOptions([]);
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              `Unable to load ${label || "options"}.`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, sourceType, organizationId, module, label]);

  const currentValue = value == null
    ? ""
    : sourceType === "QMS_STATUS"
      ? String(value).trim().toUpperCase().replace(/\s+/g, "_")
      : String(value);

  const hasCurrentOption = useMemo(
    () => options.some((item) => valueFor(item, sourceType) === currentValue),
    [options, sourceType, currentValue],
  );

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <select
        name={name}
        value={currentValue}
        onChange={(event) => onChange?.(event)}
        disabled={disabled || loading}
        required={required}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100 ${className}`}
      >
        <option value="">
          {loading ? `Loading ${label || "options"}...` : placeholder}
        </option>

        {!hasCurrentOption && currentValue && (
          <option value={currentValue}>
            {`Current: ${currentValue}`}
          </option>
        )}

        {options.map((item) => {
          const optionValue = valueFor(item, sourceType);
          if (!optionValue) return null;

          return (
            <option key={idOf(item) || optionValue} value={optionValue}>
              {labelFor(item, sourceType)}
            </option>
          );
        })}
      </select>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
