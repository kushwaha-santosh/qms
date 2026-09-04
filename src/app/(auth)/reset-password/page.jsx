"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resetPasswordRequest } from "@/lib/api/auth.api";
import toastService from "@/services/toastService/toast.service";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(
    () => String(searchParams.get("token") || "").trim(),
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const passwordValid =
    passwordRequirements.minLength &&
    passwordRequirements.hasUppercase &&
    passwordRequirements.hasLowercase &&
    passwordRequirements.hasNumber;

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("This password reset link is invalid or incomplete.");
      return;
    }

    if (!passwordValid) {
      setError(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number.",
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPasswordRequest({
        token,
        password,
        confirmPassword,
      });

      setSuccess(
        result?.message || "Your password has been reset successfully.",
      );
      toastService.success(
        result?.message || "Your password has been reset successfully.",
      );

      setPassword("");
      setConfirmPassword("");

      /*
       * Redirect after a short delay so the user
       * can see the success message.
       */
      setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to reset the password.",
      );
      toastService.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to reset the password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-6xl">
        <div className="flex min-h-[620px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          {/* ==================================================
              LEFT BRANDING PANEL
          ================================================== */}

          <section className="relative hidden w-[52%] overflow-hidden bg-slate-950 lg:flex">
            <div className="absolute inset-0">
              <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

              <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="absolute inset-0 opacity-[0.05]">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />
              </div>
            </div>

            <div className="relative z-10 flex h-full w-full flex-col justify-between p-8 xl:p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg">
                  <ShieldIcon />
                </div>

                <div>
                  <div className="text-lg font-bold tracking-tight text-white">
                    QMS AI
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Quality Management System
                  </div>
                </div>
              </div>

              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Secure Account Recovery
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                  Create a new
                  <span className="block text-slate-400">secure password.</span>
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
                  Protect your QMS AI account with a strong, unique password.
                </p>

                <div className="mt-7 space-y-3">
                  <SecurityItem
                    title="Secure reset link"
                    description="Your reset link is protected by a secure token."
                  />

                  <SecurityItem
                    title="One-time use"
                    description="The reset link becomes invalid after your password is changed."
                  />

                  <SecurityItem
                    title="Automatic expiration"
                    description="Reset links expire after the configured recovery period."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>© {new Date().getFullYear()} QMS AI</span>

                <span>Secure • Reliable • Compliant</span>
              </div>
            </div>
          </section>

          {/* ==================================================
              RIGHT RESET PASSWORD PANEL
          ================================================== */}

          <section className="flex w-full items-center justify-center bg-white px-6 py-10 sm:px-10 lg:w-[48%] lg:px-10 xl:px-12">
            <div className="w-full max-w-md">
              {/* MOBILE LOGO */}

              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <ShieldIcon />
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

                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Reset your password
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter a new password for your QMS AI account.
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertIcon />

                  <span>{error}</span>
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div
                  className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  role="status"
                >
                  <CheckIcon />

                  <span>{success}</span>
                </div>
              )}

              {/* INVALID TOKEN */}

              {!token ? (
                <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  This password reset link is invalid or incomplete.
                  <button
                    type="button"
                    onClick={() => router.replace("/forgot-password")}
                    className="mt-3 block font-semibold underline underline-offset-2"
                  >
                    Request a new reset link
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {/* PASSWORD */}

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      New password
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <LockIcon />
                      </div>

                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-gray-50"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    </div>

                    {(passwordFocused || password.length > 0) && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <div className="mb-2 text-xs font-medium text-gray-600">
                          Password requirements
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Requirement
                            valid={passwordRequirements.minLength}
                            text="8+ characters"
                          />

                          <Requirement
                            valid={passwordRequirements.hasUppercase}
                            text="Uppercase letter"
                          />

                          <Requirement
                            valid={passwordRequirements.hasLowercase}
                            text="Lowercase letter"
                          />

                          <Requirement
                            valid={passwordRequirements.hasNumber}
                            text="Number"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Confirm new password
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <LockIcon />
                      </div>

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        required
                        autoComplete="new-password"
                        disabled={loading}
                        placeholder="Confirm new password"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-gray-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        disabled={loading}
                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-700"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        <EyeIcon visible={showConfirmPassword} />
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div
                        className={`mt-2 text-xs ${
                          passwordsMatch ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {passwordsMatch
                          ? "Passwords match."
                          : "Passwords do not match."}
                      </div>
                    )}
                  </div>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Resetting password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowIcon />
                      </>
                    )}
                  </button>

                  {/* BACK TO LOGIN */}

                  <button
                    type="button"
                    onClick={() => router.replace("/login")}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                  >
                    <span>←</span>
                    Back to sign in
                  </button>
                </form>
              )}

              {/* SECURITY NOTE */}

              <div className="mt-7 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ShieldIcon />
                  Secure password recovery for your QMS environment
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ==========================================================
   SMALL UI COMPONENTS
========================================================== */

function Requirement({ valid, text }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] ${
        valid ? "text-emerald-600" : "text-gray-400"
      }`}
    >
      <span>{valid ? "✓" : "○"}</span>

      <span>{text}</span>
    </div>
  );
}

function SecurityItem({ title, description }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-white">
        ✓
      </div>

      <div>
        <div className="text-xs font-semibold text-white">{title}</div>

        <div className="mt-0.5 text-[11px] leading-4 text-slate-500">
          {description}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
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
  );
}

function LockIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" strokeWidth="1.7" />

      <path d="M8 10V7a4 4 0 018 0v3" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ visible }) {
  return visible ? (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M3 3l18 18" strokeWidth="1.8" strokeLinecap="round" />

      <path
        d="M10.6 10.6a2 2 0 002.8 2.8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9.9 4.3A10.9 10.9 0 0112 4c5.2 0 8.8 4.3 10 8a12.5 12.5 0 01-3.1 5.1M6.1 6.1C3.9 7.7 2.5 10 2 12c1.2 3.7 4.8 8 10 8 1 0 2-.2 2.9-.5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle cx="12" cy="12" r="2.5" strokeWidth="1.7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.7" />

      <path
        d="M8 12l2.5 2.5L16 9"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 9v4m0 4h.01M10.3 3.9l-8.1 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8.1-14a2 2 0 00-3.3 0z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        className="opacity-90"
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="ml-2 h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />

      <path
        d="M13 6l6 6-6 6"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
