import Notification from "../models/Notification.js";

/* GET /api/notifications?unreadOnly=true */
export async function listNotifications(req, res) {
  try {
    const unreadOnly = req.query.unreadOnly === "true";
    const filter = {};
    if (unreadOnly) filter.read = false;
    // recipient handling: admin vs user
    if (req.user && req.user.role !== "admin") {
      filter.recipient = req.user.id;
    }
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, notifications: items });
  } catch (err) {
    console.error("listNotifications error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
}

/* POST /api/notifications/mark-read (body: { ids: [] }) */
export async function markNotificationsRead(req, res) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.json({ success: true });
    await Notification.updateMany(
      { _id: { $in: ids.map((i) => i) } },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("markNotificationsRead error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notifications" });
  }
}
