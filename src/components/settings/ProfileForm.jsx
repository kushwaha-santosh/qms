
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  updateProfile,
} from "@/lib/api/profile.api";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
};

export default function ProfileForm({
  user,
  onUpdated,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ========================================================
  // LOAD USER
  // ========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      firstName:
        user.firstName || "",

      lastName:
        user.lastName || "",

      email:
        user.email || "",
    });
  }, [user]);

  // ========================================================
  // CHANGE FIELD
  // ========================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setError("");
    setSuccess("");
  };

  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const email =
      form.email.trim();

    if (!firstName) {
      setError(
        "First name is required."
      );

      return;
    }

    if (!email) {
      setError(
        "Email is required."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await updateProfile({
          firstName,
          lastName,
          email,
        });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to update profile."
        );
      }

      setSuccess(
        "Profile updated successfully."
      );

      const updatedUser =
        response?.data?.user;

      if (
        updatedUser &&
        onUpdated
      ) {
        onUpdated(
          updatedUser
        );
      }
    } catch (error) {
      setError(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to update profile."
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
      {/* ================================================== */}
      {/* FIRST NAME */}
      {/* ================================================== */}

      <div>
        <label
          htmlFor="firstName"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          First Name
        </label>

        <input
          id="firstName"
          name="firstName"
          type="text"
          value={
            form.firstName
          }
          onChange={
            handleChange
          }
          maxLength={100}
          disabled={loading}
          autoComplete="given-name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
          placeholder="Enter first name"
        />
      </div>

      {/* ================================================== */}
      {/* LAST NAME */}
      {/* ================================================== */}

      <div>
        <label
          htmlFor="lastName"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Last Name
        </label>

        <input
          id="lastName"
          name="lastName"
          type="text"
          value={
            form.lastName
          }
          onChange={
            handleChange
          }
          maxLength={100}
          disabled={loading}
          autoComplete="family-name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
          placeholder="Enter last name"
        />
      </div>

      {/* ================================================== */}
      {/* EMAIL */}
      {/* ================================================== */}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={
            form.email
          }
          onChange={
            handleChange
          }
          maxLength={200}
          disabled={loading}
          autoComplete="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
          placeholder="Enter email address"
        />
      </div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ================================================== */}
      {/* SUBMIT */}
      {/* ================================================== */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

