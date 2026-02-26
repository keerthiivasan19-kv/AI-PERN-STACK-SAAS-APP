import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.auth.userId;
    req.userId = userId;

    if (process.env.FORCE_PREMIUM === "true") {
      req.plan = "premium";
      req.free_usage = 0;
      return next();
    }

    const user = await clerkClient.users.getUser(userId);

    const free_usage = Number(user.privateMetadata?.free_usage ?? 0);

    req.free_usage = free_usage;
    const rawPlan =
      user.publicMetadata?.plan ||
      user.privateMetadata?.plan ||
      "free";
    req.plan = String(rawPlan).toLowerCase();

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};
