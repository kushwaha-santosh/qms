"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginRequest,
  logoutRequest,
  getCurrentUserRequest,
} from "@/lib/api/auth.api";

const AuthContext = createContext(null);

const normalizePermission = (permission) =>
  String(permission || "")
    .trim()
    .toUpperCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ==========================================================
  // PERMISSION CHECK
  // ==========================================================

  const hasPermission = useCallback(
    (requiredPermission) => {
      const required = normalizePermission(requiredPermission);

      if (!required) {
        return false;
      }

      // SUPER_ADMIN is the global system administrator and is
      // intentionally not restricted by the permission list.
      if (user?.role === "SUPER_ADMIN") {
        return true;
      }

      return permissions.some(
        (permission) =>
          normalizePermission(
            typeof permission === "string" ? permission : permission?.key,
          ) === required,
      );
    },
    [permissions, user],
  );

  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.role) {
        return false;
      }

      return roles.includes(user.role);
    },
    [user],
  );

  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCurrentUserRequest();

      if (response?.success && response?.data?.user) {
        const authenticatedUser = response.data.user;

        setUser(authenticatedUser);

        setPermissions(
          response.data.permissions || authenticatedUser.permissions || [],
        );
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      setUser(null);
      setPermissions([]);

      // 401 simply means there is no active session.
      // Do not treat it as an application error.
      if (error?.response?.status !== 401) {
        console.error("Unable to load authenticated user:", error);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // ==========================================================
  // INITIAL SESSION CHECK
  // ==========================================================
  //
  // IMPORTANT:
  // The application uses cookie-based authentication
  // (`withCredentials: true`).
  //
  // Therefore we do not check localStorage for a token.
  //
  // When the user is already on /login, there is no reason
  // to call /auth/me during the initial AuthProvider mount.
  //
  // After successful login, login() explicitly calls
  // loadUser(), so the authenticated user and permissions
  // are still loaded correctly.
  //
  // ==========================================================

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (currentPath === "/login") {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      setInitialized(true);

      return;
    }

    loadUser();
  }, [loadUser]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = useCallback(
    async (email, password, rememberMe = false) => {
      try {
        setLoading(true);
        setInitialized(false);

        const response = await loginRequest({
          email,
          password,
          rememberMe,
        });

        if (!response?.success || !response?.data?.user) {
          throw new Error(response?.message || "Login failed.");
        }

        /*
         * Do NOT rely only on the user returned
         * from login.
         *
         * The login response may not contain
         * the complete RBAC permission list.
         *
         * Fetch /auth/me immediately so user
         * and permissions are synchronized.
         *
         * The login request has already established
         * the authentication cookie, so /auth/me
         * can now authenticate successfully.
         */

        await loadUser();

        return response.data.user;
      } finally {
        setLoading(false);
      }
    },
    [loadUser],
  );

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = useCallback(async () => {
    /*
     * Clear the frontend authentication state first.
     *
     * This immediately removes the authenticated user
     * and permissions from the application.
     */

    setUser(null);
    setPermissions([]);

    try {
      setLoading(true);

      /*
       * Backend logout should invalidate/clear the
       * authentication cookie.
       */
      await logoutRequest();
    } catch (error) {
      /*
       * Even if the backend logout request fails,
       * the local authentication state remains cleared.
       */
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const value = {
    user,
    permissions,

    loading,
    initialized,

    isAuthenticated: Boolean(user),

    hasPermission,
    hasRole,

    login,
    logout,

    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==========================================================
// USE AUTH
// ==========================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
