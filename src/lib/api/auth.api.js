import api from "./axios";

export const loginRequest = async ({ email, password, rememberMe = false }) => {
  const response = await api.post("/auth/login", {
    email: email.trim(),
    password,
    rememberMe,
  });

  return response.data;
};

export const getCurrentUserRequest = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

export const logoutRequest = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};

// ==========================================================
// FORGOT PASSWORD
// ==========================================================

export const forgotPasswordRequest = async (email) => {
  if (!email?.trim()) {
    throw new Error("Email is required.");
  }

  const response = await api.post("/auth/forgot-password", {
    email: email.trim(),
  });

  return response.data;
};

// ==========================================================
// RESET PASSWORD
// ==========================================================

export const resetPasswordRequest = async ({
  token,
  password,
  confirmPassword,
}) => {
  if (!token) {
    throw new Error("Password reset token is required.");
  }

  if (!password) {
    throw new Error("New password is required.");
  }

  if (!confirmPassword) {
    throw new Error("Please confirm your password.");
  }

  const response = await api.post("/auth/reset-password", {
    token,
    password,
    confirmPassword,
  });

  return response.data;
};
