import Notification from "../models/Notification.js";

/**
 * createNotification({ type, title, message, link, meta, recipient })
 * recipient: optional user id (for user-specific notifications). Null for admin/system.
 */
export async function createNotification({
  type,
  title,
  message,
  link = null,
  meta = {},
  recipient = null,
}) {
  try {
    const n = await Notification.create({
      type,
      title,
      message,
      link,
      meta,
      recipient,
    });
    return n;
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
}
