import { Router } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  // verifyEmail,
  // resendVerificationEmail,
  // startOAuth,
  // oauthCallback,
  oauthLogin,
  syncUser,
  me,
  // updateProfile,
  session,
  getUserSessions,
  oauth,
  // revokeSession,
  // revokeAllSessions,
  callback
} from "@/controllers/auth";
import { requireAuth } from "@/middlewares/auth";

const router = Router();

router.post("/callback", callback)

// Basic Authentication
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Password Management
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth(), changePassword);

// Email Verification
// router.post("/verify-email", verifyEmail);
// router.post("/resend-verification", resendVerificationEmail);
// router.post("/resend-verification", requireAuth, resendVerificationEmail);

// OAuth
// router.all("/oauth/:provider/start", startOAuth);
router.get("/oauth/callback", oauth);
router.post("/oauth", oauthLogin);
router.post("/sync-user", syncUser);

// Profile Management
router.get("/me", requireAuth(), me);
// router.put("/profile", requireAuth, updateProfile);

// Session Management
router.get("/session", session);
router.get("/sessions", requireAuth(), getUserSessions);
// router.post("/sessions/revoke", requireAuth, revokeSession);
// router.post("/sessions/revoke-all", requireAuth, revokeAllSessions);

export default router;
