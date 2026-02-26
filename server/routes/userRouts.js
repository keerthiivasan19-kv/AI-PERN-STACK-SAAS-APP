import {
  getUsage,
  upgradePlan,
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
} from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";
import express from "express";

const userRouter = express.Router();

userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", auth, getPublishedCreations);
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);
userRouter.get("/get-usage", auth, getUsage);
userRouter.post("/upgrade", auth, upgradePlan);

export default userRouter;
