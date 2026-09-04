"use client";

import { useEffect, useState } from "react";

import { getOrganizations } from "@/lib/api/organization.api";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  organizationId: "",
  role: "EMPLOYEE",
  status: "ACTIVE",
};

const ROLES = [
  "ORG_ADMIN",
  "QUALITY_MANAGER",
  "QUALITY_ENGINEER",
  "AUDITOR",
  "EMPLOYEE",
  "VIEWER",
];

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UserFormModal({
  open,
  user,
  loading,
  currentUser,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const [error, setError] = useState("");

  const [organizations, setOrganizations] = useState([]);

  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  const [organizationsError, setOrganizationsError] = useState("");

  const isEditing = Boolean(user);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // ==========================================================
  // INITIALIZE FORM
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      setForm({
        firstName: user.firstName || "",

        lastName: user.lastName || "",

        email: user.email || "",

        password: "",

        organizationId: user.organizationId?._id || user.organizationId || "",

        role: user.role || "EMPLOYEE",

        status: user.status || "ACTIVE",
      });
    } else {
      setForm({
        ...INITIAL_FORM,
      });
    }

    setError("");
    setOrganizationsError("");
  }, [open, user]);

  // ==========================================================
  // LOAD ORGANIZATIONS FOR SUPER ADMIN
  // ==========================================================

  useEffect(() => {
    if (!open || !isSuperAdmin || isEditing) {
      return;
    }

    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setOrganizationsLoading(true);

        setOrganizationsError("");

        const response = await getOrganizations();

        if (cancelled) {
          return;
        }

        /*
         * getOrganizations() is normalized
         * and always returns an array.
         */
        setOrganizations(Array.isArray(response) ? response : []);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error("Unable to load organizations:", requestError);

        setOrganizationsError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to load organizations.",
        );

        setOrganizations([]);
      } finally {
        if (!cancelled) {
          setOrganizationsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin, isEditing]);

  // ==========================================================
  // CLOSE
  // ==========================================================

  if (!open) {
    return null;
  }

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================================
  // HANDLE SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.firstName.trim()) {
      setError("First name is required.");

      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");

      return;
    }

    if (!isEditing && !form.password) {
      setError("Password is required.");

      return;
    }

    if (form.password && form.password.length < 8) {
      setError("Password must contain at least 8 characters.");

      return;
    }

    /*
     * SUPER_ADMIN must select an organization
     * when creating a user.
     */
    if (!isEditing && isSuperAdmin && !form.organizationId) {
      setError("Please select an organization.");

      return;
    }

    /*
     * Build payload.
     */
    const payload = {
      firstName: form.firstName.trim(),

      lastName: form.lastName.trim(),

      email: form.email.trim(),

      ...(form.password
        ? {
            password: form.password,
          }
        : {}),

      role: form.role,

      status: form.status,
    };

    /*
     * SUPER_ADMIN explicitly selects
     * the target organization.
     */
    if (isSuperAdmin && !isEditing) {
      payload.organizationId = form.organizationId;
    }

    /*
     * Organization users do NOT send
     * organizationId.
     *
     * Backend derives it from the
     * authenticated user's organization.
     */

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.apiMessage ||
          submitError?.message ||
          "Unable to save user.",
      );
    }
  };

  const organizationSelectorDisabled = loading || organizationsLoading;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* ==================================================
        HEADER
    ================================================== */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit User" : "Create User"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "Update user account details."
                : isSuperAdmin
                  ? "Create a user and assign them to an organization."
                  : "Create a new user within your organization."}
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

        {/* ==================================================
        FORM
    ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-180px)] overflow-y-auto"
        >
          <div className="space-y-5 p-6">
            {/* ERROR */}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ORGANIZATION ERROR */}

            {isSuperAdmin && !isEditing && organizationsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {organizationsError}
              </div>
            )}

            {/* ==================================================
            ORGANIZATION SELECTOR
        ================================================== */}

            {isSuperAdmin && !isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  name="organizationId"
                  value={form.organizationId}
                  onChange={handleChange}
                  disabled={organizationSelectorDisabled}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {organizationsLoading
                      ? "Loading organizations..."
                      : "Select organization"}
                  </option>

                  {Array.isArray(organizations) &&
                    organizations.map((organization) => (
                      <option key={organization._id} value={organization._id}>
                        {organization.name}

                        {organization.status && organization.status !== "ACTIVE"
                          ? ` (${organization.status})`
                          : ""}
                      </option>
                    ))}
                </select>

                {!organizationsLoading &&
                  organizations.length === 0 &&
                  !organizationsError && (
                    <p className="mt-1 text-xs text-gray-500">
                      No organizations available.
                    </p>
                  )}
              </div>
            )}

            {/* ==================================================
            NAME
        ================================================== */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>

                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>

                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* ==================================================
            EMAIL
        ================================================== */}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
                placeholder="user@example.com"
              />
            </div>

            {/* ==================================================
            PASSWORD
        ================================================== */}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isEditing ? "New Password" : "Password"}
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
                placeholder={
                  isEditing
                    ? "Leave blank to keep current password"
                    : "Minimum 8 characters"
                }
              />
            </div>

            {/* ==================================================
            ROLE / STATUS
        ================================================== */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-black"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-black"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ==================================================
          FOOTER
      ================================================== */}

          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                organizationsLoading ||
                (isSuperAdmin && !isEditing && organizations.length === 0)
              }
              className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : isEditing
                  ? "Update User"
                  : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
