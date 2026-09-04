"use client";

import { useEffect, useMemo, useState } from "react";

import { getProductById } from "@/lib/api/product.api";
import { getLocation } from "@/lib/api/location.api";

export default function NCRDetailsModal({
  open,
  ncr,
  loading = false,
  onClose,
  onEdit,
  onStatus,
  canEdit = false,
  canChangeStatus = false,
}) {
  const [resolvedProduct, setResolvedProduct] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState("");
  const [resolvingReferences, setResolvingReferences] = useState(false);

  /*
   * ==========================================================
   * RESOLVE PRODUCT + LOCATION
   * ==========================================================
   */

  useEffect(() => {
    if (!open || !ncr) return;

    let cancelled = false;

    const resolveReferences = async () => {
      setResolvingReferences(true);

      try {
        /*
         * ------------------------------------------------------
         * PRODUCT
         * ------------------------------------------------------
         */

        const productValue = ncr?.product;

        if (productValue) {
          /*
           * If product is already populated/object
           */
          if (typeof productValue === "object") {
            const productName =
              productValue?.name ||
              productValue?.productName ||
              productValue?.displayName ||
              productValue?.code ||
              "";

            if (!cancelled) {
              setResolvedProduct(productName);
            }
          } else {
            /*
             * Otherwise resolve Product ID
             */
            try {
              const product = await getProductById(productValue);

              const productName =
                product?.name ||
                product?.productName ||
                product?.displayName ||
                product?.code ||
                "";

              if (!cancelled) {
                setResolvedProduct(productName || String(productValue));
              }
            } catch (error) {
              console.error("Unable to resolve NCR product:", error);

              if (!cancelled) {
                setResolvedProduct(String(productValue));
              }
            }
          }
        } else if (!cancelled) {
          setResolvedProduct("");
        }

        /*
         * ------------------------------------------------------
         * LOCATION
         * ------------------------------------------------------
         */

        const locationValue = ncr?.location;

        if (locationValue) {
          /*
           * If location is already populated/object
           */
          if (typeof locationValue === "object") {
            const path = await buildLocationPath(locationValue);

            if (!cancelled) {
              setResolvedLocation(path);
            }
          } else {
            /*
             * Resolve location hierarchy from Location ID
             */
            try {
              const location = await getLocation(locationValue);

              const normalizedLocation = extractLocation(location) || {
                _id: locationValue,
                name: String(locationValue),
              };

              const path = await buildLocationPath(normalizedLocation);

              if (!cancelled) {
                setResolvedLocation(path);
              }
            } catch (error) {
              console.error("Unable to resolve NCR location:", error);

              if (!cancelled) {
                setResolvedLocation(String(locationValue));
              }
            }
          }
        } else if (!cancelled) {
          setResolvedLocation("");
        }
      } finally {
        if (!cancelled) {
          setResolvingReferences(false);
        }
      }
    };

    resolveReferences();

    return () => {
      cancelled = true;
    };
  }, [open, ncr]);

  /*
   * ==========================================================
   * DISPLAY FIELDS
   * ==========================================================
   */

  const fields = useMemo(
    () => [
      ["Status", ncr?.status, "text"],
      ["Severity", ncr?.severity, "text"],
      ["Category", ncr?.category, "text"],
      ["Source", ncr?.source, "text"],
      ["Detected Date", ncr?.detectedAt || ncr?.detectedDate, "date"],
      ["Due Date", ncr?.dueDate, "date"],
      ["Department", ncr?.department, "text"],
      ["Process", ncr?.process, "text"],
      [
        "Location",
        resolvingReferences ? "Loading..." : resolvedLocation || ncr?.location,
        "text",
      ],
      [
        "Product",
        resolvingReferences ? "Loading..." : resolvedProduct || ncr?.product,
        "text",
      ],
      ["Batch Number", ncr?.batchNumber, "text"],
      ["Supplier", ncr?.supplier, "text"],
      ["Assigned To", person(ncr?.assignedTo), "text"],
      ["Reported By", person(ncr?.reportedBy), "text"],
      ["Created By", person(ncr?.createdBy), "text"],
      ["Updated By", person(ncr?.updatedBy), "text"],
      ["Created", ncr?.createdAt, "date"],
      ["Updated", ncr?.updatedAt, "date"],
    ],
    [ncr, resolvedProduct, resolvedLocation, resolvingReferences],
  );

  const longFields = [
    ["Description", ncr?.description],
    ["Immediate Action", ncr?.immediateAction],
    ["Containment Action", ncr?.containmentAction],
    ["Root Cause", ncr?.rootCause],
    ["Corrective Action", ncr?.correctiveAction],
    ["Preventive Action", ncr?.preventiveAction],
    ["Verification", ncr?.verification],
    ["Closure Comment", ncr?.closureComment],
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {ncr?.ncrNumber || "NCR"}
            </div>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {ncr?.title || "NCR Details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ======================================================
            BODY
        ====================================================== */}

        {loading ? (
          <div className="p-8">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="overflow-y-auto p-6">
              <div className="grid gap-5 md:grid-cols-2">
                {fields.map(([label, value, type]) => (
                  <Info
                    key={label}
                    label={label}
                    value={type === "date" ? formatDate(value) : value || "—"}
                  />
                ))}

                {longFields.map(([label, value]) => (
                  <LongInfo key={label} label={label} value={value} />
                ))}
              </div>
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                Close
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit?.(ncr)}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Edit
                </button>
              )}

              {canChangeStatus && (
                <button
                  type="button"
                  onClick={() => onStatus?.(ncr)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Change Status
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * INFO
 * ============================================================
 */

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-800">
        {displayValue(label, value)}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * LONG INFO
 * ============================================================
 */

function LongInfo({ label, value }) {
  return (
    <div className="md:col-span-2">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * PERSON
 * ============================================================
 */

function person(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return "";
  }

  const name = `${value.firstName || ""} ${value.lastName || ""}`.trim();

  return name || value.name || value.fullName || value.email || "";
}

/*
 * ============================================================
 * DATE
 * ============================================================
 */

function formatDate(value) {
  if (!value || value === "—") return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
 * ============================================================
 * DISPLAY VALUE
 * ============================================================
 */

function displayValue(label, value) {
  if (!value) return "—";

  const normalized = String(value).trim().toUpperCase();

  const labels = {
    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    OPEN: "Open",

    UNDER_REVIEW: "Under Investigation",
    UNDER_INVESTIGATION: "Under Investigation",

    ACTION_IN_PROGRESS: "Action In Progress",

    VERIFICATION: "Pending Verification",
    PENDING_VERIFICATION: "Pending Verification",

    REOPENED: "Reopened",

    CLOSED: "Closed",

    CANCELLED: "Cancelled",

    // --------------------------------------------------------
    // SOURCE
    // --------------------------------------------------------

    INTERNAL_AUDIT: "Internal Audit",
    EXTERNAL_AUDIT: "External Audit",
    CUSTOMER_COMPLAINT: "Customer Complaint",
    SUPPLIER_COMPLAINT: "Supplier Complaint",
    EMPLOYEE: "Employee",
    PROCESS: "Process",
    PRODUCT: "Product",
    MANAGEMENT_REVIEW: "Management Review",
  };

  return labels[normalized] || value;
}

/*
 * ============================================================
 * LOCATION HELPERS
 * ============================================================
 */

/**
 * Extract the actual location object from different
 * possible API response structures.
 */
function extractLocation(response) {
  if (!response) return null;

  return (
    response?.data?.location ||
    response?.data?.record ||
    response?.data?.item ||
    response?.location ||
    response?.record ||
    response?.item ||
    response?.data ||
    response
  );
}

/**
 * Get a location's display name.
 */
function locationName(location) {
  if (!location) return "";

  return (
    location?.name ||
    location?.displayName ||
    location?.locationName ||
    location?.code ||
    ""
  );
}

/**
 * Get parent location ID from different possible schemas.
 */
function parentLocationId(location) {
  if (!location) return "";

  const parent =
    location?.parentId || location?.parentLocationId || location?.parent;

  if (!parent) return "";

  if (typeof parent === "object") {
    return parent?._id || parent?.id || "";
  }

  return String(parent);
}

/**
 * Build complete location hierarchy.
 *
 * Example:
 *
 * India → Uttar Pradesh → Plant 1 → Building A → Production
 */
async function buildLocationPath(initialLocation) {
  if (!initialLocation) return "";

  const hierarchy = [];

  let current = initialLocation;

  /*
   * Prevent accidental infinite loops in malformed
   * parent relationships.
   */
  const visited = new Set();

  while (current) {
    const currentId = current?._id || current?.id || "";

    if (currentId) {
      const normalizedId = String(currentId);

      if (visited.has(normalizedId)) {
        break;
      }

      visited.add(normalizedId);
    }

    const name = locationName(current);

    if (name) {
      hierarchy.unshift(name);
    }

    /*
     * If parent is already populated, use it.
     */
    if (current?.parent && typeof current.parent === "object") {
      current = current.parent;
      continue;
    }

    const parentId = parentLocationId(current);

    if (!parentId) {
      break;
    }

    try {
      const response = await getLocation(parentId);

      const parentLocation = extractLocation(response);

      if (!parentLocation) {
        break;
      }

      current = parentLocation;
    } catch (error) {
      console.error("Unable to resolve parent location:", error);

      break;
    }
  }

  return hierarchy.join(" → ");
}
