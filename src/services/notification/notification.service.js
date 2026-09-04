import mongoose from "mongoose";
import Notification from "@/models/Notification.js";

const error = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const oid = (value) => value && mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
const id = (value) => value == null ? null : String(value);
const userScope = (user) => { const userId = oid(user?._id || user?.id); if (!userId) throw error("Authenticated user is required.", 401); return { userId }; };
const orgId = (user) => oid(user?.organizationId?._id || user?.organizationId);
const serialize = (item) => { if (!item) return null; const n = item.toObject ? item.toObject() : item; return { ...n, _id: id(n._id), userId: id(n.userId), organizationId: id(n.organizationId), recordId: id(n.recordId) }; };

export const createNotification = async ({ user, userId, organizationId, type, module = "SYSTEM", title, message, recordId = null, recordNumber = null, href = null, priority = "MEDIUM", dedupeKey = null, expiresAt = null, metadata = null, suppressErrors = true } = {}) => {
  try {
    const targetUserId = oid(userId || user?._id || user?.id);
    if (!targetUserId) throw error("Notification recipient is required.");
    if (!type) throw error("Notification type is required.");
    if (!title?.trim()) throw error("Notification title is required.");
    if (!message?.trim()) throw error("Notification message is required.");
    const targetOrg = organizationId !== undefined ? oid(organizationId?._id || organizationId) : orgId(user);
    if (dedupeKey) { const existing = await Notification.findOne({ userId: targetUserId, dedupeKey: String(dedupeKey), isRead: false }).lean(); if (existing) return serialize(existing); }
    const item = await Notification.create({ organizationId: targetOrg, userId: targetUserId, type: String(type).trim().toUpperCase(), module: String(module || "SYSTEM").trim().toUpperCase(), title: String(title).trim(), message: String(message).trim(), recordId, recordNumber: recordNumber ? String(recordNumber).trim() : null, href: href ? String(href).trim() : null, priority: String(priority || "MEDIUM").toUpperCase(), isRead: false, readAt: null, dedupeKey: dedupeKey ? String(dedupeKey).trim() : null, expiresAt, metadata });
    return serialize(item);
  } catch (e) { console.error("[Notification] Create failed:", e); if (suppressErrors) return null; throw e; }
};

export const createNotifications = async (args = {}) => {
  const recipients = [...new Set((Array.isArray(args.userIds) ? args.userIds : []).filter(Boolean).map(String))];
  return (await Promise.all(recipients.map(userId => createNotification({ ...args, userId, dedupeKey: args.dedupeKey ? `${args.dedupeKey}:${userId}` : null })))).filter(Boolean);
};

export const listNotifications = async ({ user, page = 1, limit = 20, unreadOnly = false, module = "", type = "" } = {}) => {
  const scope = userScope(user); const p = Math.max(Number.parseInt(page, 10) || 1, 1); const l = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100); const active = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }; const query = { ...scope, ...active };
  if (unreadOnly) query.isRead = false; if (module) query.module = String(module).trim().toUpperCase(); if (type) query.type = String(type).trim().toUpperCase();
  const [items, total, unreadCount] = await Promise.all([Notification.find(query).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(), Notification.countDocuments(query), Notification.countDocuments({ ...scope, isRead: false, ...active })]);
  return { notifications: items.map(serialize), pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l), hasPreviousPage: p > 1, hasNextPage: p * l < total }, unreadCount };
};

export const getUnreadNotificationCount = async ({ user } = {}) => Notification.countDocuments({ ...userScope(user), isRead: false, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

export const markNotificationRead = async ({ user, notificationId } = {}) => updateRead(user, notificationId, true);
export const markNotificationUnread = async ({ user, notificationId } = {}) => updateRead(user, notificationId, false);
const updateRead = async (user, notificationId, isRead) => { const n = oid(notificationId); if (!n) throw error("Invalid notification ID."); const item = await Notification.findOneAndUpdate({ ...userScope(user), _id: n }, { $set: { isRead, readAt: isRead ? new Date() : null } }, { new: true }).lean(); if (!item) throw error("Notification not found.", 404); return serialize(item); };

export const markAllNotificationsRead = async ({ user } = {}) => { const r = await Notification.updateMany({ ...userScope(user), isRead: false }, { $set: { isRead: true, readAt: new Date() } }); return { modifiedCount: r.modifiedCount || 0 }; };
export const deleteNotification = async ({ user, notificationId } = {}) => { const n = oid(notificationId); if (!n) throw error("Invalid notification ID."); const r = await Notification.deleteOne({ ...userScope(user), _id: n }); if (!r.deletedCount) throw error("Notification not found.", 404); return { deleted: true }; };
export const notifyRecord = (args = {}) => createNotification(args);
