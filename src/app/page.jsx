"use client";
import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  }, [user, loading, router]);
  // redirect("/login");
}
