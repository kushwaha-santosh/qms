"use client";

export default function ProductPagination({
  pagination = {},
  loading = false,
  onPageChange,
}) {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || 0;

  if (!total) {
    return null;
  }

  const start = (page - 1) * limit + 1;

  const end = Math.min(page * limit, total);

  const previousDisabled = loading || page <= 1;

  const nextDisabled = loading || page >= totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span> to{" "}
        <span className="font-medium text-slate-700">{end}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> products
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={previousDisabled}
          onClick={() => onPageChange?.(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="px-2 text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onPageChange?.(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
