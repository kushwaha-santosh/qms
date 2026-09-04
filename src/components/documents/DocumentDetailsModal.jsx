"use client";

import { useState } from "react";
import { getDocumentAccessToken } from "@/lib/api/documents.api";

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .trim()
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  // return date.toLocaleDateString("en-US");
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};
export default function DocumentDetailsModal({ open, document, onClose }) {
  const [viewing, setViewing] = useState(false);
  const [viewError, setViewError] = useState("");

  if (!open || !document) return null;

  const viewUploadedDocument = async () => {
    if (!document?._id || document.fileSource !== "UPLOAD") return;
    setViewing(true);
    setViewError("");
    try {
      const response = await getDocumentAccessToken(document._id);
      const token = response?.token || response?.data?.token;
      if (!token) throw new Error("Unable to create document access token.");
      window.open(`/api/documents/secure/${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    } catch (e) {
      setViewError(e?.response?.data?.message || e?.message || "Unable to open document.");
    } finally {
      setViewing(false);
    }
  };
  const owner =
    [document.owner?.firstName, document.owner?.lastName]
      .filter(Boolean)
      .join(" ") ||
    document.owner?.email ||
    "—";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Document Details</h2>
          <button onClick={onClose} className="text-2xl text-slate-400">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {[
            ["Document Number", document.documentNumber],
            ["Title", document.title],
            ["Type", document.documentType],
            ["Category", document.category],
            ["Department", document.department],
            ["Revision", document.revision],
            ["Source", document.fileSource || "—"],
            ["Status", formatStatus(document.status)],
            ["Owner", owner],
            [
              "Effective Date",
              // document.effectiveDate
              //   ? String(document.effectiveDate).slice(0, 10)
              //   : "—",
              document.effectiveDate ? formatDate(document.effectiveDate) : "—",
            ],
            [
              "Review Date",
              // document.reviewDate
              //   ? String(document.reviewDate).slice(0, 10)
              //   : "—",

              document.reviewDate ? formatDate(document.reviewDate) : "—",
            ],
            [
              "Expiry Date",
              // document.expiryDate
              //   ? String(document.expiryDate).slice(0, 10)
              //   : "-",
              document.expiryDate ? formatDate(document.expiryDate) : "—",
            ],
            [
              "File",
              document.fileName || document.fileUrl ? (
                document.fileSource === "UPLOAD" ? (
                  <button
                    type="button"
                    onClick={viewUploadedDocument}
                    disabled={viewing}
                    className="text-blue-600 underline disabled:opacity-50"
                  >
                    {viewing ? "Preparing document..." : document.fileName || "View document"}
                  </button>
                ) : document.fileUrl ? (
                  <a
                    className="text-blue-600 underline"
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {document.fileName || "Open document"}
                  </a>
                ) : (
                  document.fileName
                )
              ) : (
                "—"
              ),
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-medium uppercase text-slate-500">
                {label}
              </div>
              <div className="mt-1 break-words text-sm text-slate-900">
                {value || "—"}
              </div>
            </div>
          ))}
          {viewError && (
            <div className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {viewError}
            </div>
          )}
          <div className="md:col-span-2 rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase text-slate-500">
              Description
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {document.description || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
