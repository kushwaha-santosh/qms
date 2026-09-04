"use client";

import {
  useState,
} from "react";

import {
  changePassword,
} from "@/lib/api/profile.api.js";

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordForm() {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !form.currentPassword
      ) {
        setError(
          "Current password is required."
        );
        return;
      }

      if (
        form.newPassword.length <
        8
      ) {
        setError(
          "New password must contain at least 8 characters."
        );
        return;
      }

      if (
        form.newPassword !==
        form.confirmPassword
      ) {
        setError(
          "New password and confirmation password do not match."
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await changePassword(
            form
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to change password."
          );
        }

        setForm(
          INITIAL_FORM
        );

        setSuccess(
          "Password changed successfully."
        );
      } catch (err) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to change password."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Change Password
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Use a strong password that you do not use elsewhere.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Current Password
        </label>

        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          value={
            form.currentPassword
          }
          onChange={
            handleChange
          }
          disabled={loading}
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          placeholder="Enter current password"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          New Password
        </label>

        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={
            form.newPassword
          }
          onChange={
            handleChange
          }
          disabled={loading}
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          placeholder="Enter new password"
        />

        <p className="mt-1 text-xs text-gray-500">
          Minimum 8 characters.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Confirm New Password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={
            form.confirmPassword
          }
          onChange={
            handleChange
          }
          disabled={loading}
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          placeholder="Confirm new password"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Changing..."
            : "Change Password"}
        </button>
      </div>
    </form>
  );
}