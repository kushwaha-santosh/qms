"use client";

import { useEffect, useState } from "react";

import { getLocation } from "@/lib/api/location.api.js";

const idOf = (value) =>
  typeof value === "object"
    ? value?._id || value?.id || value?.locationId || ""
    : value || "";

const locationLabel = (item) =>
  item?.name ||
  item?.locationName ||
  item?.displayName ||
  item?.code ||
  item?.pincode ||
  "—";

const locationType = (item) => String(item?.type || "").toUpperCase();

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return (
      value?.name || value?.displayName || value?.code || value?.label || "—"
    );
  }

  return String(value);
};

const formatPerson = (value) => {
  if (Array.isArray(value)) {
    return (
      value
        .map((item) => formatPerson(item))
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  if (typeof value === "object" && value) {
    return (
      `${value?.firstName || ""} ${value?.lastName || ""}`.trim() ||
      value?.email ||
      "—"
    );
  }

  return value || "—";
};

export default function AuditDetailsModal({
  open,
  audit,
  loading = false,
  onClose,
  onEdit,
  onStatus,
  canEdit = false,
  canChangeStatus = false,
}) {
  const [locationChain, setLocationChain] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // ========================================================
  // LOAD LOCATION HIERARCHY
  // ========================================================

  useEffect(() => {
    if (!open || !audit?.location) {
      setLocationChain([]);
      return;
    }

    let cancelled = false;

    const loadLocationChain = async () => {
      try {
        setLocationLoading(true);
        setLocationError("");

        const chain = [];

        let currentId = idOf(audit.location);

        /*
         * Safety limit prevents an accidental circular
         * parent hierarchy from causing an infinite loop.
         */
        for (let index = 0; index < 10 && currentId; index += 1) {
          const response = await getLocation(currentId);

          const item = response?.data || response?.location || response;

          if (!item) {
            break;
          }

          chain.push(item);

          const parentId = item?.parentId?._id || item?.parentId || "";

          currentId = String(parentId || "");
        }

        if (!cancelled) {
          setLocationChain(chain);
        }
      } catch (error) {
        if (!cancelled) {
          setLocationChain([]);

          setLocationError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load location hierarchy.",
          );
        }
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    };

    loadLocationChain();

    return () => {
      cancelled = true;
    };
  }, [open, audit]);

  if (!open) {
    return null;
  }

  // ========================================================
  // LOCATION DISPLAY
  // ========================================================

  const locationByType = {};

  locationChain.forEach((item) => {
    const type = locationType(item);

    if (type) {
      locationByType[type] = locationLabel(item);
    }
  });

  const orderedLocation = ["COUNTRY", "STATE", "DISTRICT", "CITY", "PINCODE"]
    .map((type) => locationByType[type])
    .filter(Boolean);

  const locationText =
    orderedLocation.length > 0
      ? orderedLocation.join(" → ")
      : audit?.location
        ? locationLabel(audit.location)
        : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">
        {/* HEADER */}

        <div className="flex justify-between border-b px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">
              {audit?.auditNumber || "AUDIT"}
            </div>

            <h2 className="text-lg font-semibold">
              {audit?.title || "Audit Details"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-8">Loading...</div>
        ) : (
          <>
            <div className="overflow-y-auto p-6">
              <div className="grid gap-5 md:grid-cols-2">
                {/* STATUS */}

                <Detail label="Status" value={formatValue(audit?.status)} />

                {/* AUDIT TYPE */}

                <Detail
                  label="Audit Type"
                  value={formatValue(audit?.auditType)}
                />

                {/* DATES */}

                <Detail
                  label="Audit Date"
                  value={formatDate(audit?.auditDate)}
                />

                <Detail label="Due Date" value={formatDate(audit?.dueDate)} />

                {/* DEPARTMENT */}

                <Detail
                  label="Department"
                  value={formatValue(audit?.department)}
                />

                {/* PROCESS */}

                <Detail label="Process" value={formatValue(audit?.process)} />

                {/* LOCATION */}

                <div>
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Location
                  </div>

                  <div className="mt-1 text-sm font-medium text-slate-800">
                    {locationLoading ? "Loading location..." : locationText}
                  </div>

                  {locationError && (
                    <div className="mt-1 text-xs text-red-600">
                      {locationError}
                    </div>
                  )}
                </div>

                {/* PRODUCT */}

                <Detail label="Product" value={formatValue(audit?.product)} />

                {/* LEAD AUDITOR */}

                <Detail
                  label="Lead Auditor"
                  value={formatPerson(audit?.leadAuditor)}
                />

                {/* AUDITORS */}

                <Detail
                  label="Auditors"
                  value={formatPerson(audit?.auditors)}
                />

                {/* LONG TEXT */}

                <TextDetail label="Scope" value={audit?.scope} />

                <TextDetail label="Criteria" value={audit?.criteria} />

                <TextDetail label="Description" value={audit?.description} />

                <TextDetail label="Findings" value={audit?.findings} />
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl border bg-white px-4 py-2.5"
              >
                Close
              </button>

              {canEdit && (
                <button
                  onClick={() => onEdit?.(audit)}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-white"
                >
                  Edit
                </button>
              )}

              {canChangeStatus && (
                <button
                  onClick={() => onStatus?.(audit)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-white"
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

// ==========================================================
// DETAIL
// ==========================================================

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}

// ==========================================================
// TEXT DETAIL
// ==========================================================

function TextDetail({ label, value }) {
  return (
    <div className="md:col-span-2">
      <div className="text-xs font-medium uppercase text-slate-400">
        {label}
      </div>

      <div className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}
