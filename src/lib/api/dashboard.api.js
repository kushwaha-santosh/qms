import api from "./axios";

// ==========================================================
// DASHBOARD API
// ==========================================================
//
// Supported:
//
// getDashboard()
//
// getDashboard({
//   startDate: "2026-04-01",
//   endDate: "2026-09-04",
// })
//
// ==========================================================

export const getDashboard = async ({ startDate = "", endDate = "" } = {}) => {
  const response = await api.get("/dashboard", {
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });

  return response?.data?.data || {};
};

export default {
  getDashboard,
};
