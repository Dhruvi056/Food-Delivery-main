import insforge from "../config/insforge.js";

export const getNotifications = async (req, res) => {
  try {
    const { data: notifications, error } = await insforge.database
      .from("notifications")
      .select("*")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { error } = await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.userId);

    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
