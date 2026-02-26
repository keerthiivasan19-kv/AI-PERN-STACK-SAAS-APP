import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";

const FREE_USAGE_LIMIT = Number(process.env.FREE_USAGE_LIMIT || 3);
const ALLOW_DB_FAILURES = process.env.ALLOW_DB_FAILURES === "true";
const UNLIMITED_USAGE = process.env.UNLIMITED_USAGE === "true";

export const getUserCreations = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const creations =
      await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

    res.json({ success: true, creations });
  } catch (error) {
    if (ALLOW_DB_FAILURES) {
      return res.json({ success: true, creations: [] });
    }
    res.json({ success: false, message: error.message });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const creations =
      await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

    res.json({ success: true, creations });
  } catch (error) {
    if (ALLOW_DB_FAILURES) {
      return res.json({ success: true, creations: [] });
    }
    res.json({ success: false, message: error.message });
  }
};

export const toggleLikeCreation = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.body;

    const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;

    if (!creation) {
      return res.json({ success: false, message: "Creation not found." });
    }

    const currentLikes = creation.likes;
    const userIdStr = userId.toString();
    let updatedLikes;
    let message;

    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    const formattedArray = `{${updatedLikes.join(", ")}}`;

    await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

    res.json({ success: true, message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUsage = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      plan: req.plan || "free",
      free_usage: req.free_usage || 0,
      limit: UNLIMITED_USAGE ? null : FREE_USAGE_LIMIT,
      unlimited: UNLIMITED_USAGE,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const upgradePlan = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const allowUpgrade =
      process.env.ALLOW_DEV_UPGRADE === "true" ||
      process.env.NODE_ENV !== "production";

    if (!allowUpgrade) {
      return res.status(403).json({
        success: false,
        message: "Upgrade is disabled in this environment.",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { ...(user.publicMetadata || {}), plan: "premium" },
      privateMetadata: {
        ...(user.privateMetadata || {}),
        free_usage: 0,
      },
    });

    res.json({ success: true, plan: "premium" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
