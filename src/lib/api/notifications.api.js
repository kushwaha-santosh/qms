import api from "@/lib/api/axios.js";
export const getNotifications = async (params = {}) =>
  (
    await api.get("/notifications", {
      params: { page: 1, limit: 20, unreadOnly: false, ...params },
    })
  ).data;
export const getUnreadNotificationCount = async () =>
  (await api.get("/notifications/unread")).data;
export const markNotificationRead = async (id) =>
  (await api.patch(`/notifications/${id}`, { isRead: true })).data;
export const markNotificationUnread = async (id) =>
  (await api.patch(`/notifications/${id}`, { isRead: false })).data;
export const markAllNotificationsRead = async () =>
  (await api.patch("/notifications/mark-all-read")).data;
export const deleteNotification = async (id) =>
  (await api.delete(`/notifications/${id}`)).data;
