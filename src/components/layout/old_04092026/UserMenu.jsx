"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthProvider";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || "User";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase() || "U";

  const handleLogout = async () => {
    setOpen(false);

    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
          {initials}
        </div>

        <div className="hidden text-left sm:block">
          <div className="text-sm font-semibold text-gray-900">
            {fullName}
          </div>

          <div className="text-xs text-gray-500">
            {user.role || "User"}
          </div>
        </div>

        <svg
          className="hidden h-4 w-4 text-gray-500 sm:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m19 9-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">
              {fullName}
            </p>

            <p className="truncate text-xs text-gray-500">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/settings/profile");
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            My Profile
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}