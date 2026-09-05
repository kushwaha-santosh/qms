"use client";

import { DataTablePagination } from "@/components/common/data-table";

export default function LocationPagination({ pagination, onPageChange, loading }) {
  return (
    <DataTablePagination
      pagination={pagination}
      loading={loading}
      onPageChange={onPageChange}
      entityLabel="location(s)"
    />
  );
}
