"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthProvider";
import AppShell from "@/components/layout/AppShell";

export default function ProtectedLayout({ children }) {
  const router = useRouter();

  const { user, loading, initialized } = useAuth();

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">Loading...</div>

          <div className="mt-1 text-sm text-gray-500">
            Verifying your session
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!user) {
    return null;
  }

  // ==========================================================
  // PROTECTED APPLICATION
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-100">
      <AppShell>{children}</AppShell>
    </div>
  );
}
