"use client";

import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

export default function NCRFilters({
  filters,
  onChange,
  onClear,
  organizationId = "",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <input
          value={filters.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
          placeholder="Search NCR..."
          className="rounded-xl border px-3 py-2.5 text-sm"
        />

        <QMSReferenceSelect
          name="status"
          sourceType="QMS_STATUS"
          module="NCR"
          value={filters.status}
          onChange={(e) => onChange("status", e.target.value)}
          organizationId={organizationId}
          placeholder="All statuses"
        />

        <QMSReferenceSelect
          name="severity"
          sourceType="QMS_SEVERITY"
          module="NCR"
          value={filters.severity}
          onChange={(e) => onChange("severity", e.target.value)}
          organizationId={organizationId}
          placeholder="All severities"
        />

        <QMSReferenceSelect
          name="category"
          sourceType="QMS_CATEGORY"
          module="NCR"
          value={filters.category}
          onChange={(e) => onChange("category", e.target.value)}
          organizationId={organizationId}
          placeholder="All categories"
        />

        <QMSReferenceSelect
          name="source"
          sourceType="QMS_SOURCE"
          module="NCR"
          value={filters.source}
          onChange={(e) => onChange("source", e.target.value)}
          organizationId={organizationId}
          placeholder="All sources"
        />

        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border px-4 py-2.5 text-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
