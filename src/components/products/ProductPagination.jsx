"use client";

import { DataTablePagination } from "@/components/common/data-table";

export default function ProductPagination({ pagination, loading, onPageChange }) {
  return (
    <DataTablePagination
      pagination={pagination}
      loading={loading}
      onPageChange={onPageChange}
      entityLabel="products"
    />
  );
}
