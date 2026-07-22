import { Router } from "express";
import { forgotPassword, login, logout, me, refresh, register, resetPasswordController } from "../controllers/authController";
import { authenticate } from "../middlewares/authenticate";
import { authRateLimit } from "../middlewares/rateLimit";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/refresh", authRateLimit, refresh);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.post("/forgot-password", authRateLimit, forgotPassword);
authRouter.post("/reset-password", authRateLimit, resetPasswordController);
