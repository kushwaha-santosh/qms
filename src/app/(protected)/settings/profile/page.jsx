"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useAuth,
} from "@/context/AuthProvider.jsx";

import {
    getProfile,
} from "@/lib/api/profile.api.js";

import ProfileForm from "@/components/settings/ProfileForm.jsx";

import ChangePasswordForm from "@/components/settings/ChangePasswordForm.jsx";

// ==========================================================
// ICON
// ==========================================================

function Icon({
    name,
    className = "h-5 w-5",
}) {
    const common = {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    };

    if (name === "user") {
        return (
            <svg {...common}> <path
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 21a8 8 0 0 0-16 0"
            /> <circle
                    cx="12"
                    cy="7"
                    r="4"
                    strokeWidth="1.8"
                /> </svg>
        );
    }

    if (name === "shield") {
        return (
            <svg {...common}> <path
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z"
            /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9.5 12 1.7 1.7 3.8-3.8"
                /> </svg>
        );
    }

    if (name === "mail") {
        return (
            <svg {...common}> <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                strokeWidth="1.8"
            /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 7 8 6 8-6"
                /> </svg>
        );
    }

    if (name === "building") {
        return (
            <svg {...common}> <path
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"
            /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M16 9h4v12"
                /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M8 7h4M8 11h4M8 15h4"
                /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M2 21h20"
                /> </svg>
        );
    }

    if (name === "lock") {
        return (
            <svg {...common}> <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
                strokeWidth="1.8"
            /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                /> </svg>
        );
    }

    if (name === "check") {
        return (
            <svg {...common}> <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
            /> </svg>
        );
    }

    if (name === "settings") {
        return (
            <svg {...common}> <path
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            /> <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5H14.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V13.6h-.1a1.7 1.7 0 0 0-1.1 1.4Z"
                /> </svg>
        );
    }

    return null;
}

// ==========================================================
// HELPERS
// ==========================================================

const getInitials = (profile) => {
    const first =
        profile?.firstName
            ?.trim()
            ?.charAt(0) || "";

    const last =
        profile?.lastName
            ?.trim()
            ?.charAt(0) || "";

    const initials =
        `${first}${last}`.toUpperCase();

    if (initials) {
        return initials;
    }

    return (
        profile?.email
            ?.charAt(0)
            ?.toUpperCase() || "U"
    );
};

const getFullName = (profile) => {
    const name =
        `${profile?.firstName || ""} ${profile?.lastName || ""
            }`.trim();

    return (
        name ||
        profile?.email ||
        "User"
    );
};

const formatRole = (role) => {
    if (!role) {
        return "Not configured";
    }

    return role
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

// ==========================================================
// PAGE
// ==========================================================

export default function ProfileSettingsPage() {
    const {
        user,
        refreshUser,
    } = useAuth();

    const [profile, setProfile] =
        useState(user);

    const [loading, setLoading] =
        useState(!user);

    const [error, setError] =
        useState("");

    // ========================================================
    // SYNC AUTH USER
    // ========================================================

    useEffect(() => {
        if (user) {
            setProfile(user);
        }
    }, [user]);

    // ========================================================
    // LOAD PROFILE
    // ========================================================

    useEffect(() => {
        const loadProfile =
            async () => {
                if (user) {
                    return;
                }


                try {
                    setLoading(true);
                    setError("");

                    const response =
                        await getProfile();

                    if (
                        response?.success &&
                        response?.data?.user
                    ) {
                        setProfile(
                            response.data.user
                        );
                    }
                } catch (err) {
                    setError(
                        err?.response?.data
                            ?.message ||
                        err?.message ||
                        "Unable to load profile."
                    );
                } finally {
                    setLoading(false);
                }
            };

        loadProfile();


    }, [user]);

    // ========================================================
    // PROFILE UPDATED
    // ========================================================

    const handleProfileUpdated =
        async (updatedUser) => {
            if (updatedUser) {
                setProfile(
                    updatedUser
                );
            }


            try {
                await refreshUser();
            } catch (refreshError) {
                console.error(
                    "Unable to refresh authenticated user:",
                    refreshError
                );
            }
        };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return (<div className="flex min-h-[500px] items-center justify-center"> <div className="flex items-center gap-3"> <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />


            <span className="text-sm font-medium text-gray-500">
                Loading profile...
            </span>
        </div>
        </div>
        );


    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error) {
        return (<div className="mx-auto w-full max-w-6xl"> <div className="rounded-2xl border border-red-200 bg-red-50 p-5"> <div className="flex items-start gap-3">


            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                !
            </div>

            <div>
                <h2 className="text-sm font-semibold text-red-800">
                    Unable to load profile
                </h2>

                <p className="mt-1 text-sm text-red-700">
                    {error}
                </p>
            </div>

        </div>
        </div>
        </div>
        );


    }

    const initials =
        getInitials(profile);

    const fullName =
        getFullName(profile);

    const role =
        formatRole(profile?.role);

    const organization =
        profile
            ?.organizationId
            ?.name ||
        "Global / System";

    // ========================================================
    // PAGE
    // ========================================================

    return (<div className="mx-auto w-full max-w-6xl space-y-6 pb-10">


        {/* ================================================== */}
        {/* PAGE TITLE */}
        {/* ================================================== */}

        <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <span>Settings</span>

                <span>/</span>

                <span className="text-gray-600">
                    Profile
                </span>
            </div>

            <div className="mt-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Profile Settings
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage your personal information
                    and account security.
                </p>
            </div>
        </div>


        {/* ================================================== */}
        {/* ACCOUNT OVERVIEW */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:px-7">

                {/* User */}

                <div className="flex min-w-0 items-center gap-4 lg:w-[34%]">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white shadow-sm">
                        {initials}
                    </div>

                    <div className="min-w-0">

                        <h2 className="truncate text-base font-bold text-gray-900">
                            {fullName}
                        </h2>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                            <Icon
                                name="mail"
                                className="h-3.5 w-3.5"
                            />

                            <span className="truncate">
                                {profile?.email || "-"}
                            </span>
                        </div>

                    </div>

                </div>


                {/* Divider */}

                <div className="hidden h-12 w-px bg-gray-200 lg:block" />


                {/* Role */}

                <div className="flex items-center gap-3 lg:flex-1">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600 ring-1 ring-gray-100">
                        <Icon
                            name="shield"
                            className="h-4 w-4"
                        />
                    </div>

                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Role
                        </div>

                        <div className="mt-0.5 text-sm font-semibold text-gray-900">
                            {role}
                        </div>
                    </div>

                </div>


                {/* Organization */}

                <div className="flex items-center gap-3 lg:flex-1">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600 ring-1 ring-gray-100">
                        <Icon
                            name="building"
                            className="h-4 w-4"
                        />
                    </div>

                    <div className="min-w-0">

                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Organization
                        </div>

                        <div className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                            {organization}
                        </div>

                    </div>

                </div>


                {/* Status */}

                <div className="flex items-center gap-3 lg:flex-1">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100">
                        <Icon
                            name="check"
                            className="h-4 w-4"
                        />
                    </div>

                    <div>

                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Status
                        </div>

                        <div className="mt-1">

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                {profile?.status ||
                                    "UNKNOWN"}
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </section>


        {/* ================================================== */}
        {/* TWO COLUMN SETTINGS */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">


            {/* ================================================= */}
            {/* PERSONAL INFORMATION */}
            {/* ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                            <Icon
                                name="user"
                                className="h-5 w-5"
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Personal Information
                            </h2>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Update your first name, last name
                                and contact information.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="px-6 py-6">

                    <ProfileForm
                        user={profile}
                        onUpdated={
                            handleProfileUpdated
                        }
                    />

                </div>

            </section>


            {/* ================================================= */}
            {/* SECURITY */}
            {/* ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                            <Icon
                                name="lock"
                                className="h-5 w-5"
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Change Password
                            </h2>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Update your password to keep your
                                account secure.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="px-6 py-6">

                    <ChangePasswordForm />

                </div>

            </section>

        </div>



    </div>


    );
}
