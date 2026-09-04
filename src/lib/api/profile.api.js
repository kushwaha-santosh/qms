import api from "./axios";

// ==========================================================
// GET CURRENT PROFILE
// ==========================================================

export const getProfile =
  async () => {
    const response =
      await api.get(
        "/users/profile"
      );

    return response.data;
  };

// ==========================================================
// UPDATE CURRENT PROFILE
// ==========================================================

export const updateProfile =
  async (data) => {
    const response =
      await api.patch(
        "/users/profile",
        data
      );

    return response.data;
  };

// ==========================================================
// CHANGE PASSWORD
// ==========================================================

export const changePassword =
  async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    const response =
      await api.patch(
        "/users/profile/password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );

    return response.data;
  };