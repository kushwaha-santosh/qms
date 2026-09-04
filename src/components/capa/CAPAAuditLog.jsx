"use client";

import { useEffect, useState } from "react";

import { getCAPAAuditLogs } from "@/lib/api/capa.api.js";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const getUserName = (log) => {
  const user = log?.userId;

  if (user) {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return (
      name ||
      user.name ||
      user.fullName ||
      user.email ||
      log.userName ||
      "System"
    );
  }

  return log?.userName || "System";
};

const formatRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatAction = (action) => {
  if (!action) {
    return "AUDIT";
  }

  return String(action)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function CAPAAuditLog({ open, capa, onClose }) {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !capa) {
      return;
    }

    const loadLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const capaId = capa._id || capa.capaNumber;

        if (!capaId) {
          throw new Error("CAPA ID is required.");
        }

        const result = await getCAPAAuditLogs(capaId, {
          page: 1,
          limit: 50,
        });

        const auditLogs =
          result?.auditLogs ||
          result?.data?.auditLogs ||
          result?.logs ||
          result?.data?.logs ||
          [];

        setLogs(Array.isArray(auditLogs) ? auditLogs : []);
      } catch (loadError) {
        console.error("CAPA audit log error:", loadError);

        setLogs([]);

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Unable to load audit history.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [open, capa]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Audit History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {capa?.capaNumber || "CAPA"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading audit history...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
              No audit history found.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  // className="rounded-lg border border-slate-200 p-4"
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {formatAction(log.action)}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {log.description || "-"}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>
                      User:{" "}
                      <strong className="font-medium text-slate-700">
                        {getUserName(log)}
                      </strong>
                      {log?.userId?.role && (
                        <> ({formatRole(log.userId.role)})</>
                      )}
                    </span>

                    <span>
                      Module:{" "}
                      <strong className="font-medium text-slate-700">
                        {log.module || "CAPA"}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
