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

/*
 * ==========================================================
 * CURRENT USER REQUEST DEDUPLICATION
 * ==========================================================
 *
 * React Strict Mode can execute the initial effect twice
 * during development.
 *
 * Without this guard:
 *
 *   mount #1 -> /auth/me
 *   mount #2 -> /auth/me
 *
 * Both requests are identical and unnecessary.
 *
 * Keep the currently running request at module level so it
 * survives the Strict Mode effect cleanup/remount cycle.
 */
let currentUserRequestPromise = null;

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

  const loadUser = useCallback(async (options = {}) => {
    const { force = false } = options;

    /*
     * If a request is already running, reuse it.
     *
     * This is the important Strict Mode protection.
     *
     * `force` does NOT create a second concurrent request.
     * It simply means that an already completed request should
     * not be treated as a cached result.
     */
    if (!force && currentUserRequestPromise) {
      return currentUserRequestPromise;
    }

    if (currentUserRequestPromise) {
      return currentUserRequestPromise;
    }

    const request = (async () => {
      try {
        setLoading(true);

        const response = await getCurrentUserRequest();

        if (response?.success && response?.data?.user) {
          const authenticatedUser = response.data.user;

          setUser(authenticatedUser);

          setPermissions(
            response.data.permissions || authenticatedUser.permissions || [],
          );

          return authenticatedUser;
        }

        setUser(null);
        setPermissions([]);

        return null;
      } catch (error) {
        setUser(null);
        setPermissions([]);

        // 401 simply means there is no active session.
        // Do not treat it as an application error.
        if (error?.response?.status !== 401) {
          console.error("Unable to load authenticated user:", error);
        }

        return null;
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    })();

    currentUserRequestPromise = request;

    try {
      return await request;
    } finally {
      /*
       * Only clear the promise if it is still the same request.
       *
       * This protects against a future request being assigned
       * before an older request finishes.
       */
      if (currentUserRequestPromise === request) {
        currentUserRequestPromise = null;
      }
    }
  }, []);

  // ==========================================================
  // INITIAL SESSION CHECK
  // ==========================================================
  //
  // The application uses cookie-based authentication
  // (`withCredentials: true`).
  //
  // Therefore we do not check localStorage for a token.
  //
  // When the user is already on /login, there is no reason
  // to call /auth/me during the initial AuthProvider mount.
  //
  // ==========================================================

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (
      currentPath === "/login" ||
      currentPath === "/forgot-password" ||
      currentPath === "/reset-password"
    ) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      setInitialized(true);

      return;
    }

    /*
     * Do not use a component-level `useRef` here.
     *
     * React Strict Mode can recreate the component instance.
     * The module-level request promise inside loadUser()
     * handles the duplicate request instead.
     */
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
         * The login response may not contain the complete
         * RBAC permission list.
         *
         * Fetch /auth/me after login so the authenticated
         * user and permissions are synchronized.
         *
         * `force: true` means this is an intentional refresh.
         * If another /auth/me request is already running,
         * loadUser() still reuses that request.
         */
        await loadUser({ force: true });

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
