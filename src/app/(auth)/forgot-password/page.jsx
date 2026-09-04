"use client";

import { useState } from "react";
import Link from "next/link";

import { forgotPasswordRequest } from "@/lib/api/auth.api";
import toastService from "@/services/toastService/toast.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await forgotPasswordRequest(email);

      setSuccess(
        response.message ||
          "If an account exists for this email, a password reset link has been sent.",
      );
      toastService.success(
        response.message ||
          "If an account exists for this email, a password reset link has been sent.",
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to process your request.",
      );
      toastService.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to process your request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="p-6 sm:p-8">
            {/* LOGO */}

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9 12l2 2 4-4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <div className="font-bold text-gray-900">QMS AI</div>

                <div className="text-xs text-gray-500">
                  Quality Management System
                </div>
              </div>
            </div>

            {/* HEADING */}

            <div>
              <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Password Recovery
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Forgot your password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                role="status"
              >
                {success}
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M4 6h16v12H4z"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M4 7l8 6 8-6"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg
                      className="mr-2 h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />

                      <path
                        d="M21 12a9 9 0 00-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* BACK TO LOGIN */}

            <div className="mt-6 border-t border-gray-100 pt-5 text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
