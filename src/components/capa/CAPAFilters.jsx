"use client";

import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function CAPAFilters({
  filters,
  onChange,
  onReset,
  organizations = [],
  showOrganizationFilter = false,
}) {
  const organizationId = filters.organizationId || "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
        {showOrganizationFilter && (
          <select
            value={filters.organizationId || ""}
            onChange={(e) => onChange("organizationId", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All Organizations</option>
            {organizations.map((organization) => (
              <option key={organization._id} value={organization._id}>
                {organization.name ||
                  organization.displayName ||
                  organization.email}
              </option>
            ))}
          </select>
        )}

        <input
          value={filters.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
          placeholder="Search CAPA..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />

        <QMSReferenceSelect
                name="status"
          sourceType="QMS_STATUS"
          module="CAPA"
          value={filters.status}
          onChange={(e) => onChange("status", e.target.value)}
          organizationId={organizationId}
          placeholder="All Statuses"
        />

        <QMSReferenceSelect
                name="severity"
          sourceType="QMS_SEVERITY"
          module="CAPA"
          value={filters.severity}
          onChange={(e) => onChange("severity", e.target.value)}
          organizationId={organizationId}
          placeholder="All Severities"
        />

        <QMSReferenceSelect
                name="category"
          sourceType="QMS_CATEGORY"
          module="CAPA"
          value={filters.category}
          onChange={(e) => onChange("category", e.target.value)}
          organizationId={organizationId}
          placeholder="All Categories"
        />

        <QMSReferenceSelect
          name="source"
          sourceType="QMS_SOURCE"
          module="CAPA"
          value={filters.source}
          onChange={(e) => onChange("source", e.target.value)}
          organizationId={organizationId}
          placeholder="All Sources"
        />

        <QMSReferenceSelect
          name="department"
          sourceType="DEPARTMENT"
          module="CAPA"
          value={filters.department}
          onChange={(e) => onChange("department", e.target.value)}
          organizationId={organizationId}
          placeholder="All Departments"
        />

        <QMSReferenceSelect
          name="process"
          sourceType="PROCESS"
          module="CAPA"
          value={filters.process}
          onChange={(e) => onChange("process", e.target.value)}
          organizationId={organizationId}
          placeholder="All Processes"
        />

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
