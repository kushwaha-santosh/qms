"use client";
const fmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
};
const p = (v) =>
  String(v || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export default function SupplierDetailsModal({ open, record, onClose }) {
  if (!open || !record) return null;
  const r = record;
  const rows = [
    ["Supplier Code", r.supplierCode],
    ["Name", r.name],
    ["Supplier Type", p(r.supplierType)],
    ["Category", p(r.category)],
    ["Contact Person", r.contactPerson],
    ["Email", r.email],
    ["Phone", r.phone],
    ["Rating", r.rating ?? "—"],
    ["Status", p(r.status)],
    ["Status Comment", r.statusComment],
    ["Qualification Date", fmt(r.qualificationDate)],
    ["Next Review Date", fmt(r.nextReviewDate)],
    ["Country", r.country],
    ["Address", r.address],
    ["Description", r.description],
  ];
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Supplier Details</h2>
          <button onClick={onClose} className="text-2xl text-slate-400">
            ×
          </button>
        </div>
        <div className="mt-5 divide-y rounded-xl border">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-2 px-4 py-3 md:grid-cols-3">
              <span className="font-medium text-slate-600">{k}</span>
              <span className="md:col-span-2 whitespace-pre-wrap">
                {v || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
