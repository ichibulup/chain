import { z } from "zod";

export const providerEnum = z.enum(["google", "facebook"]);
export type OAuthProvider = z.infer<typeof providerEnum>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  redirectTo: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
// export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(6),
});
// export type LoginInput = z.infer<typeof loginSchema>;

export const logoutSchema = z.object({
  accessToken: z.string().min(10).optional(),
  scope: z.enum(["global", "local"]).optional(),
});
// export type LogoutInput = z.infer<typeof logoutSchema>;

export const forgotSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});
// export type ForgotInput = z.infer<typeof forgotSchema>;

export const resetSchema = z.object({
  code: z.string().min(6),
  newPassword: z.string().min(6),
});
// export type ResetInput = z.infer<typeof resetSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
  type: z.enum(["email", "recovery", "invite", "email_change"]).default("email"),
});

export const verifyEmailHashSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["email", "recovery", "invite", "email_change"]).default("email"),
});

export const verifyEmailAccessTokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  type: z.enum(["email", "recovery", "invite", "email_change"]).default("email"),
});

// Combined schema for all verification methods
export const verifyEmailCombinedSchema = z.union([
  verifyEmailSchema,
  verifyEmailHashSchema,
  verifyEmailAccessTokenSchema
]);

// export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const startOAuthSchema = z.object({
  provider: providerEnum,
  redirectTo: z.string().url(),
  scopes: z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
});
// export type StartOAuthInput = z.infer<typeof startOAuthSchema>;

export const oauthCallbackSchema = z.object({
  code: z.string().min(6),
});
// export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

export const sessionFromCookiesSchema = z.object({
  accessToken: z.string().min(10).optional(),
  refreshToken: z.string().min(10).optional(),
});
// export type SessionFromCookiesInput = z.infer<typeof sessionFromCookiesSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export const oauthLoginSchema = z.object({
  provider: z.string().min(1),
  code: z.string().optional(),
  state: z.string().optional(),
  session: z.any().optional(),
  user: z.any().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  phoneCode: z.string().optional(),
  bio: z.string().max(500).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1),
});
