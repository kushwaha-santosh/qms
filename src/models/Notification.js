import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, uppercase: true, trim: true, index: true },
  module: { type: String, default: "SYSTEM", uppercase: true, trim: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  recordId: { type: mongoose.Schema.Types.Mixed, default: null },
  recordNumber: { type: String, default: null, trim: true, maxlength: 100 },
  href: { type: String, default: null, trim: true, maxlength: 500 },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM", index: true },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  dedupeKey: { type: String, default: null, index: true },
  expiresAt: { type: Date, default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
