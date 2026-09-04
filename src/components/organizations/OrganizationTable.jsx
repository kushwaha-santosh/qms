"use client";

const formatPlan = (value) => {
  if (!value) {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getStatusClasses = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 border-green-200";

    case "SUSPENDED":
      return "bg-red-50 text-red-700 border-red-200";

    case "INACTIVE":
      return "bg-gray-100 text-gray-700 border-gray-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getStatusDotClasses = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500";

    case "SUSPENDED":
      return "bg-red-500";

    case "INACTIVE":
      return "bg-gray-400";

    default:
      return "bg-gray-400";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Active";

    case "INACTIVE":
      return "Inactive";

    case "SUSPENDED":
      return "Suspended";

    default:
      return status || "Unknown";
  }
};

export default function OrganizationTable({
  organizations = [],
  loading = false,
  onEdit,
  onStatusChange,
  canUpdate = false,
}) {
  /* ========================================================
   * LOADING
   * ======================================================== */

  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map(
          (item) => (
            <div
              key={item}
              className="flex items-center gap-4 px-6 py-5"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

              <div className="hidden h-4 w-48 animate-pulse rounded bg-gray-200 md:block" />

              <div className="hidden h-4 w-24 animate-pulse rounded bg-gray-200 sm:block" />

              <div className="ml-auto h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          )
        )}
      </div>
    );
  }

  /* ========================================================
   * EMPTY
   * ======================================================== */

  if (
    !Array.isArray(organizations) ||
    organizations.length === 0
  ) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h2m-2 4h2m2-4h2m-2 4h2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          No organizations found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          There are no organizations available.
        </p>
      </div>
    );
  }

  /* ========================================================
   * TABLE
   * ======================================================== */

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Organization
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contact
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Industry
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Plan
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </th>

            {canUpdate && (
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {organizations.map(
            (organization) => {
              const status =
                organization?.status ||
                "ACTIVE";

              return (
                <tr
                  key={organization?._id}
                  className="hover:bg-gray-50"
                >
                  {/* ORGANIZATION */}

                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">
                        {organization?.name ||
                          "-"}
                      </span>

                      <span className="text-xs text-gray-400">
                        {organization?.email ||
                          "-"}
                      </span>
                    </div>
                  </td>

                  {/* CONTACT */}

                  <td className="px-6 py-4 align-top">
                    <span className="text-sm text-gray-600">
                      {organization?.phone ||
                        "—"}
                    </span>
                  </td>

                  {/* INDUSTRY */}

                  <td className="px-6 py-4 align-top">
                    <span className="text-sm text-gray-600">
                      {organization?.industry ||
                        "—"}
                    </span>
                  </td>

                  {/* PLAN */}

                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {formatPlan(
                        organization?.plan
                      )}
                    </span>
                  </td>

                  {/* STATUS */}

                  <td className="px-6 py-4 align-top">
                    {canUpdate ? (
                      <div className="relative inline-flex">
                        <span
                          className={`pointer-events-none absolute left-2.5 top-1/2 z-10 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${getStatusDotClasses(
                            status
                          )}`}
                        />

                        <select
                          value={status}
                          onChange={(event) =>
                            onStatusChange?.(
                              organization,
                              event.target.value
                            )
                          }
                          className={`appearance-none rounded-full border py-1.5 pl-6 pr-8 text-xs font-medium outline-none transition focus:ring-2 focus:ring-gray-300 ${getStatusClasses(
                            status
                          )}`}
                          aria-label={`Change status for ${
                            organization?.name ||
                            "organization"
                          }`}
                        >
                          <option value="ACTIVE">
                            Active
                          </option>

                          <option value="INACTIVE">
                            Inactive
                          </option>

                          <option value="SUSPENDED">
                            Suspended
                          </option>
                        </select>

                        <svg
                          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          status
                        )}`}
                      >
                        <span
                          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getStatusDotClasses(
                            status
                          )}`}
                        />

                        {getStatusLabel(
                          status
                        )}
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}

                  {canUpdate && (
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onEdit?.(
                              organization
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}