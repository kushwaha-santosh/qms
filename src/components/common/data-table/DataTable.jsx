"use client";

/**
 * Shared table presentation shell.
 *
 * Business/module-specific tables remain responsible for their columns,
 * cell rendering, actions, permissions and data mapping. This component
 * centralizes the table surface and horizontal scrolling.
 */
export default function DataTable({ children, className = "", minWidth = "min-w-full" }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <div className={minWidth}>{children}</div>
      </div>
    </div>
  );
}
