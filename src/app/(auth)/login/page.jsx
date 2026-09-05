"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import toastService from "@/services/toastService/toast.service";

export default function LoginPage() {
  const router = useRouter();

  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await login(email, password, rememberMe);

      router.replace("/dashboard");

      toastService.success(
        `Good to see you again! ${response.firstName} ${response.lastName}`,
      );
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message || error.message || "Unable to login.",
      );
      toastService.error(
        error.response?.data?.message || error.message || "Unable to login.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      {" "}
      <div className="flex w-full max-w-6xl items-center justify-center">
        {" "}
        <div className="flex w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:h-[calc(100vh-3rem)] lg:max-h-[760px]">
          {/* ==================================================
LEFT BRANDING PANEL
================================================== */}

          <section className="relative hidden w-[52%] overflow-hidden bg-slate-950 lg:flex">
            {/* Decorative background */}

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
              {/* ==================================================
              LOGO
          ================================================== */}

              <div>
                <div className="flex items-center gap-3">
                  <div
                    //  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg"
                    className="
    flex
    h-9
    w-9
    shrink-0
    items-center
    justify-center
    rounded-xl
    bg-slate-900
    text-sm
    font-bold
    text-white
    shadow-sm

    dark:!border
    dark:!border-white
    dark:!bg-transparent
    dark:!text-white
    dark:!shadow-none
    qms-sidebar-logo"
                  >
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
                    <div className="text-lg font-bold tracking-tight text-white">
                      QMS AI
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Quality Management System
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================
              BRANDING CONTENT
          ================================================== */}

              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Enterprise Quality Management
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                  Quality Management,
                  <span className="block text-slate-400">simplified.</span>
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
                  Manage quality processes, compliance, audits and continuous
                  improvement from one secure platform.
                </p>

                {/* ==================================================
                FEATURE CARDS
            ================================================== */}

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <FeatureCard
                    icon="✓"
                    title="CAPA"
                    description="Corrective & preventive actions"
                  />

                  <FeatureCard
                    icon="✓"
                    title="Audits"
                    description="Plan and manage audits"
                  />

                  <FeatureCard
                    icon="✓"
                    title="NCR"
                    description="Track non-conformances"
                  />

                  <FeatureCard
                    icon="✓"
                    title="Documents"
                    description="Controlled documentation"
                  />
                </div>

                {/* ==================================================
                FUTURE IMAGE PLACEHOLDER
            ================================================== */}

                {/* <div className="mt-5 flex h-20 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03]">
                  <div className="text-center">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      QMS Illustration
                    </div>

                    <div className="mt-1 text-[11px] text-slate-600">
                      Illustration can be added here later
                    </div>
                  </div>
                </div> */}
              </div>

              {/* ==================================================
              FOOTER
          ================================================== */}

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>© {currentYear} QMS AI</span>

                <span>Secure • Reliable • Compliant</span>
              </div>
            </div>
          </section>

          {/* ==================================================
          RIGHT LOGIN PANEL
      ================================================== */}

          <section className="flex w-full items-center justify-center bg-white px-6 py-8 sm:px-10 lg:w-[48%] lg:px-10 xl:px-12">
            <div className="w-full max-w-md">
              {/* ==================================================
              MOBILE LOGO
          ================================================== */}

              <div className="mb-8 flex items-center gap-3 lg:hidden">
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

              {/* ==================================================
              LOGIN HEADING
          ================================================== */}

              <div>
                <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Secure Login
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Sign in to your account to continue to QMS AI.
                </p>
              </div>

              {/* ==================================================
              ERROR
          ================================================== */}

              {error && (
                <div
                  className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4m0 4h.01M10.3 3.9l-8.1 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8.1-14a2 2 0 00-3.3 0z"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span>{error}</span>
                </div>
              )}

              {/* ==================================================
              FORM
          ================================================== */}

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {/* EMAIL */}

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
                        aria-hidden="true"
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

                {/* PASSWORD */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-gray-500 transition hover:text-gray-900"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="11"
                          rx="2"
                          strokeWidth="1.7"
                        />

                        <path
                          d="M8 10V7a4 4 0 018 0v3"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M3 3l18 18"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

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
                            strokeLinejoin="round"
                          />

                          <circle cx="12" cy="12" r="2.5" strokeWidth="1.7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME */}

                <div className="flex items-center">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                    />

                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                {/* SUBMIT */}

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
                        aria-hidden="true"
                      >
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg
                        className="ml-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                        <path
                          d="M13 6l6 6-6 6"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* SECURITY NOTE */}

              <div className="mt-6 border-t border-gray-100 pt-5">
                <div
                  className="flex items-center justify-center gap-2 text-xs text-gray-400
                 dark:!border
                      dark:!border-white
                      dark:!bg-transparent
                      dark:!text-white
                      dark:!shadow-none
                      shield-icon
                "
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M9 12l2 2 4-4"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Secure access to your QMS environment
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
FEATURE CARD
========================================================== */

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm transition hover:bg-white/[0.08]">
      {" "}
      <div className="flex items-start gap-2.5">
        {" "}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-white">
          {icon}{" "}
        </div>
        <div>
          <div className="text-xs font-semibold text-white">{title}</div>

          <div className="mt-0.5 text-[10px] leading-4 text-slate-500">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
