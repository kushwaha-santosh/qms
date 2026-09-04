"use client";

export default function LocationPagination({
  pagination = {},
  onPageChange,
  loading = false,
}) {
  const page = Number(pagination?.page || 1);

  const totalPages = Number(pagination?.totalPages || 0);

  const total = Number(pagination?.total || 0);

  const limit = Number(pagination?.limit || 20);

  if (totalPages <= 1 && total <= limit) {
    return null;
  }

  const start = total === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span> to{" "}
        <span className="font-medium text-slate-700">{end}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> location(s)
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <span className="px-2 text-xs text-slate-500">
          Page <span className="font-medium text-slate-700">{page}</span> of{" "}
          <span className="font-medium text-slate-700">{totalPages}</span>
        </span>

        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
