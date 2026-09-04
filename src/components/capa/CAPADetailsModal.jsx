"use client";

import { useEffect, useState } from "react";

import { getProductById } from "@/lib/api/product.api";
import { getLocation } from "@/lib/api/location.api";

/*
 * ============================================================
 * USER
 * ============================================================
 */

const getUserName = (user) => {
  if (!user) {
    return "Unassigned";
  }

  if (typeof user === "string") {
    return user;
  }

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return name || user.name || user.fullName || user.email || "Unassigned";
};

/*
 * ============================================================
 * ROLE
 * ============================================================
 */

const formatRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/*
 * ============================================================
 * DATE
 * ============================================================
 */

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

/*
 * ============================================================
 * VALUE
 * ============================================================
 */

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
};

/*
 * ============================================================
 * EXTRACT API OBJECT
 * ============================================================
 */

const extractLocation = (response) => {
  if (!response) {
    return null;
  }

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
};

/*
 * ============================================================
 * LOCATION NAME
 * ============================================================
 */

const getLocationName = (location) => {
  if (!location) {
    return "";
  }

  return (
    location?.name ||
    location?.displayName ||
    location?.locationName ||
    location?.code ||
    ""
  );
};

/*
 * ============================================================
 * PARENT LOCATION
 * ============================================================
 */

const getParentLocationId = (location) => {
  if (!location) {
    return "";
  }

  const parent =
    location?.parentId || location?.parentLocationId || location?.parent;

  if (!parent) {
    return "";
  }

  if (typeof parent === "object") {
    return parent?._id || parent?.id || "";
  }

  return String(parent);
};

/*
 * ============================================================
 * BUILD LOCATION PATH
 * ============================================================
 *
 * Example:
 *
 * Plant 1
 *   ↓
 * Building A
 *   ↓
 * Production Floor
 *   ↓
 * Line 2
 *
 * Result:
 *
 * Plant 1 → Building A → Production Floor → Line 2
 */

const buildLocationPath = async (initialLocation) => {
  if (!initialLocation) {
    return "";
  }

  const hierarchy = [];

  let current = initialLocation;

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

    const name = getLocationName(current);

    if (name) {
      hierarchy.unshift(name);
    }

    /*
     * Parent already populated
     */
    if (current?.parent && typeof current.parent === "object") {
      current = current.parent;
      continue;
    }

    const parentId = getParentLocationId(current);

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
      console.error("Unable to resolve CAPA parent location:", error);

      break;
    }
  }

  return hierarchy.join(" → ");
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function CAPADetailsModal({ open, capa, onClose }) {
  const [resolvedProduct, setResolvedProduct] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState("");
  const [resolvingReferences, setResolvingReferences] = useState(false);

  /*
   * ==========================================================
   * RESOLVE PRODUCT + LOCATION
   * ==========================================================
   */

  useEffect(() => {
    if (!open || !capa) {
      return;
    }

    let cancelled = false;

    const resolveReferences = async () => {
      setResolvingReferences(true);

      try {
        /*
         * ------------------------------------------------------
         * PRODUCT
         * ------------------------------------------------------
         */

        const productValue = capa?.product;

        if (productValue) {
          /*
           * Product already populated
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
             * Product stored as ID
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
              console.error("Unable to resolve CAPA product:", error);

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

        const locationValue = capa?.location;

        if (locationValue) {
          /*
           * Location already populated
           */
          if (typeof locationValue === "object") {
            const path = await buildLocationPath(locationValue);

            if (!cancelled) {
              setResolvedLocation(path);
            }
          } else {
            /*
             * Location stored as ID
             */
            try {
              const response = await getLocation(locationValue);

              const location = extractLocation(response) || {
                _id: locationValue,
                name: String(locationValue),
              };

              const path = await buildLocationPath(location);

              if (!cancelled) {
                setResolvedLocation(path || String(locationValue));
              }
            } catch (error) {
              console.error("Unable to resolve CAPA location:", error);

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
  }, [open, capa]);

  /*
   * ==========================================================
   * RESET WHEN CAPA CHANGES
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      setResolvedProduct("");
      setResolvedLocation("");
      setResolvingReferences(false);
    }
  }, [open]);

  if (!open || !capa) {
    return null;
  }

  const assignedUser = capa.assignedTo;

  /*
   * ==========================================================
   * DISPLAY
   * ==========================================================
   */

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              CAPA Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">{capa.capaNumber}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="space-y-6 p-6">
          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="CAPA Number" value={capa.capaNumber} />

              <Info label="Title" value={capa.title} />

              <Info label="Source" value={capa.source} />

              <Info label="Category" value={capa.category} />

              <Info label="Severity" value={capa.severity} />

              <Info label="Status" value={capa.status} />

              <Info label="Department" value={capa.department} />

              <Info label="Process" value={capa.process} />

              <Info
                label="Product"
                value={
                  resolvingReferences
                    ? "Loading..."
                    : resolvedProduct || capa.product
                }
              />

              <Info
                label="Location"
                value={
                  resolvingReferences
                    ? "Loading..."
                    : resolvedLocation || capa.location
                }
              />

              <Info
                label="Root Cause Category"
                value={capa.rootCauseCategory}
              />

              <Info label="Due Date" value={formatDate(capa.dueDate)} />

              <Info
                label="Assigned To"
                value={
                  assignedUser
                    ? `${getUserName(assignedUser)}${
                        assignedUser.role
                          ? ` (${formatRole(assignedUser.role)})`
                          : ""
                      }`
                    : capa.assignedToName || "Unassigned"
                }
              />
            </div>
          </section>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Description
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap text-slate-700">
              {formatValue(capa.description)}
            </div>
          </section>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              CAPA Actions
            </h3>

            <div className="space-y-4">
              <TextBlock
                label="Immediate Action"
                value={capa.immediateAction}
              />

              <TextBlock label="Root Cause" value={capa.rootCause} />

              <TextBlock
                label="Corrective Action"
                value={capa.correctiveAction}
              />

              <TextBlock
                label="Preventive Action"
                value={capa.preventiveAction}
              />
            </div>
          </section>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
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
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm text-slate-900">{formatValue(value)}</div>
    </div>
  );
}

/*
 * ============================================================
 * TEXT BLOCK
 * ============================================================
 */

function TextBlock({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap text-slate-700">
        {formatValue(value)}
      </div>
    </div>
  );
}
``;
