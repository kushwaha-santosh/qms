"use client";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function DataTablePagination({
  pagination = {},
  loading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  entityLabel = "record(s)",
  showPageSize = false,
  className = "",
}) {
  const page = Math.max(1, Number(pagination?.page) || 1);
  const limit = Math.max(1, Number(pagination?.limit) || 20);
  const total = Math.max(0, Number(pagination?.total) || 0);

  const totalPages = Math.max(
    1,
    Number(pagination?.totalPages ?? pagination?.pages) ||
      (total ? Math.ceil(total / limit) : 1),
  );

  const hasPrevious =
    pagination?.hasPreviousPage ?? pagination?.hasPrevious ?? page > 1;
  const hasNext =
    pagination?.hasNextPage ?? pagination?.hasNext ?? page < totalPages;

  if (total === 0) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const changePage = (nextPage) => {
    if (loading) return;
    const target = Math.min(Math.max(1, nextPage), totalPages);
    if (target !== page) onPageChange?.(target);
  };

  const changePageSize = (event) => {
    const nextLimit = Number(event.target.value);
    if (!Number.isFinite(nextLimit) || nextLimit <= 0) return;
    onPageSizeChange?.(nextLimit);
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500">
        <span>
          Showing <span className="font-medium text-slate-700">{start}</span> to{" "}
          <span className="font-medium text-slate-700">{end}</span> of{" "}
          <span className="font-medium text-slate-700">{total}</span>{" "}
          {entityLabel}
        </span>

        {showPageSize && (
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rows</span>
            <select
              value={limit}
              onChange={changePageSize}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-500 disabled:bg-slate-50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || !hasPrevious}
          onClick={() => changePage(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <span className="min-w-[90px] px-2 text-center text-xs text-slate-500">
          Page <span className="font-medium text-slate-700">{page}</span> of{" "}
          <span className="font-medium text-slate-700">{totalPages}</span>
        </span>

        <button
          type="button"
          disabled={loading || !hasNext}
          onClick={() => changePage(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
