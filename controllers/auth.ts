import { Request, Response } from "express";
import {
  checkLoginAttempts,
  recordFailedLogin,
  resetFailedLogins,
  getUserByIdentifier,
  syncFromSupabase,
  syncUser as syncUserService,
  updateUser as updateProfileService
} from "@/services/user";
import {
  setAuthCookiesFromSession,
  setAuthCookiesFromTokens,
  clearAuthCookies,
  readAuthCookies
} from "@/middlewares/token";
import { handleError } from "@/middlewares/error";
import {
  loginSchema,
  registerSchema,
  logoutSchema,
  forgotSchema,
  resetSchema,
  verifyEmailCombinedSchema,
  startOAuthSchema,
  oauthCallbackSchema,
  sessionFromCookiesSchema,
  changePasswordSchema,
  oauthLoginSchema,
  updateProfileSchema,
  revokeSessionSchema,
} from "@/schemas/auth";
import { syncFromSupabaseSchema } from "@/schemas/user";
import { createClient } from "@/lib/supabase/client";
// import { supabaseAdmin } from "@/lib/supabase/admin";
import { httpError } from "@/middlewares/error";

const supabase = createClient()

// dotenv.config(); // Đã được config ở app/index.ts
const COOKIE_DOMAIN = process.env.EXPRESS_AUTH_COOKIE_DOMAIN === 'localhost' 
  ? undefined 
  : (process.env.EXPRESS_AUTH_COOKIE_DOMAIN || undefined);

export async function callback(
  req: Request,
  res: Response,
) {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const { session } = req.body;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required',
      });
    }

    if (!session.user) {
      return res.status(400).json({
        success: false,
        message: 'Session user is required',
      });
    }

    const sessionUserValidation = syncFromSupabaseSchema.safeParse(session.user);

    if (!sessionUserValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session user',
        errors: sessionUserValidation.error.issues,
      });
    }

    // Sync user to database
    const result = await syncUserService({
      session
      // session: {
      //   ...session,
      //   user: sessionUserValidation.data,
      // },
    });

    return res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in syncUser controller:', error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

export async function me(
  req: Request,
  res: Response
) {
  try {
    // yêu cầu middleware đã gắn req.auth
    const auth = (req as any).auth;
    const authUser = auth?.user;
    const supabaseUserId = authUser?.id ?? auth?.userId;
    if (!supabaseUserId) {
      return res.status(401).json({
        authenticated: false,
        error: "Unauthorized",
        message: "Phiên đăng nhập đã hết hạn"
      });
    }

    const dbUser = await getUserByIdentifier({ supabaseUserId });

    return res.status(200).json({
      authenticated: true,
      user: dbUser,
      dbUser,
      authUser,
    });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function changePassword(
  req: Request,
  res: Response
) {
  try {
    const auth = (req as any).auth;
    if (!auth?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // const data = await AuthService.changePassword({
    //   userId: auth.user.id,
    //   ...req.body
    // });
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}

export async function oauth(
  req: Request,
  res: Response
) {
  try {
    const { code } = req.query;
    let next = (req.query.next as string) ?? "/";
    const clientUrl = process.env.EXPRESS_PUBLIC_CLIENT_URL || 'http://localhost:3000';
    
    // Ensure next is a relative URL
    if (!next.startsWith('/')) {
      next = '/';
    }

    if (!code) {
      return res.redirect(`${clientUrl}/auth/error?error=No code provided`);
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);
    
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`${clientUrl}/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      // Sync user to local DB
      if (data.user) {
        try {
          const parsedUser = syncFromSupabaseSchema.parse(data.user);
          await syncFromSupabase(parsedUser);
        } catch (syncError) {
          console.error('Failed to sync user from Supabase:', syncError);
          // Continue anyway, as we have the session
        }
      }

      setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    }

    // Redirect to client
    return res.redirect(`${clientUrl}${next}`);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { email, password, redirectTo, metadata } = registerSchema.parse(req.body);

    // const supabase = await createClient();
    // Use environment variable for base URL, fallback to localhost
    const baseUrl = process.env.EXPRESS_PUBLIC_CLIENT_URL;
    const emailRedirectTo = redirectTo || `${baseUrl}/verify-email`;

    console.log('🔐 Registering user with email:', email);
    console.log('📧 Email redirect URL:', emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: metadata
      },
    });

    if (error) {
      console.error('❌ Supabase signup error:', error.message);

      // Handle rate limit error with better message
      if (error.message.includes('rate limit')) {
        throw httpError(429, 'Đã gửi quá nhiều email xác thực. Vui lòng đợi 5-10 phút hoặc sử dụng email khác.');
      }

      throw httpError(400, error.message);
    }

    console.log('✅ Supabase signup successful');
    console.log('👤 User created:', !!data.user);
    console.log('🔑 Session created:', !!data.session);

    if (data.user) {
      // Sync user với emailNormalized
      const parsedUser = syncFromSupabaseSchema.parse(data.user);
      const dbUser = await syncFromSupabase(parsedUser);
      // await updateProfileService({
      //   userId: dbUser.id,
      //   emailNormalized: email,
      // } as any);
    }

    // If user was created but no session (needs email verification)
    if (data.user && !data.session) {
      console.log('📧 User created but no session - email verification required');

      // Supabase automatically sends verification email on signUp
      // No need to manually resend unless there was an error
      console.log('✅ Verification email should be sent automatically by Supabase');
    } else if (data.user && data.session) {
      console.log('✅ User created with session - no email verification needed');
      // Set cookies for immediate login
      setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    }

    return res.status(200).json({
      userId: data.user?.id,
      needsEmailVerification: !data.session,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    // Check if identifier is email or username
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : identifier;

    // Check failed login attempts và account lockout
    await checkLoginAttempts(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Record failed login attempt
      await recordFailedLogin(email);
      throw httpError(401, error.message);
    }

    // if (data.user) {
    //   // Check if email is verified
    //   if (!data.user.email_confirmed_at) {
    //     console.log('❌ User email not verified:', data.user.email);
    //     throw httpError(401, "Email chưa được xác thực. Vui lòng kiểm tra email và click vào link xác thực.");
    //   }
    //
    //   // Sync user và reset failed login attempts in parallel
    //   await Promise.all([
    //     syncFromSupabase(data.user),
    //     resetFailedLogins(data.user.id)
    //   ]);
    // }
    // Sync to DB and get DB user
    let dbUser = null;
    if (data.user) {
      const parsedUser = syncFromSupabaseSchema.parse(data.user);
      dbUser = await syncFromSupabase(parsedUser);
      await resetFailedLogins(data.user.id);
    }

    setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);

    // return { user: data.user, session: data.session };

    return res.status(200).json({
      authenticated: true,
      userId: data.user?.id,
      user: data.user, // Supabase Auth user
      dbUser: dbUser,  // DB user from public schema
      // needsEmailVerification: !data.session,
      message: 'Login successful.'
    });
  } catch (e) {
    return handleError(res, e)
  }
}

export async function logout(
  req: Request,
  res: Response
) {
  try {
    // Read accessToken from cookies
    const { accessToken } = readAuthCookies(req as any);
    
    // Call logout service with token from cookies
    const payload = logoutSchema.parse({
      accessToken,
      scope: req.body?.scope || 'global',
    });
    // const data = await AuthService.logout(payload);
    
    // // Clear all auth cookies including Supabase cookies
    // clearAuthCookies(res, COOKIE_DOMAIN, req);
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) {
    // Always clear cookies even on error
    clearAuthCookies(res, COOKIE_DOMAIN, req);
    return handleError(res, e);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const payload = forgotSchema.parse(req.body);
    // const data = await AuthService.forgotPassword(payload);
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}

export async function resetPassword(
  req: Request,
  res: Response
) {
  try {
    const payload = resetSchema.parse(req.body);
    // const data = await AuthService.resetPassword(payload);
    // clearAuthCookies(res, COOKIE_DOMAIN);
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}

export async function verifyEmail(
  req: Request,
  res: Response
) {
  try {
    console.log('🔍 Verify email request body:', {
      hasEmail: !!(req.body.email),
      hasToken: !!(req.body.token),
      hasTokenHash: !!(req.body.token_hash),
      hasAccessToken: !!(req.body.access_token),
      hasRefreshToken: !!(req.body.refresh_token),
      type: req.body.type
    });

    const payload = verifyEmailCombinedSchema.parse(req.body);
    // const data = await AuthService.verifyEmail(payload);

    // console.log('🔍 Verify email response:', {
    //   hasUser: !!data.user,
    //   hasSession: !!data.session,
    //   userEmailConfirmed: data.user?.email_confirmed_at,
    //   sessionAccessToken: !!data.session?.access_token,
    //   sessionRefreshToken: !!data.session?.refresh_token
    // });

    // // **CRITICAL: Set auth cookies if session exists**
    // if (data.session) {
    //   setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    //   console.log('✅ Auth cookies set successfully:', {
    //     accessToken: !!data.session.access_token,
    //     refreshToken: !!data.session.refresh_token
    //   });
    // } else {
    //   console.log('⚠️ No session returned from verify email - cookies not set');
    // }

    // return res.status(200).json({
    //   ok: true,
    //   authenticated: !!data.session,
    //   user: data.user,
    //   message: 'Email verified successfully'
    // });
  } catch (e) {
    console.error('❌ Verify email error:', e);
    return handleError(res, e);
  }
}

export async function session(
  req: Request,
  res: Response
) {
  try {
    const { accessToken, refreshToken } = readAuthCookies(req as any);
    const payload = sessionFromCookiesSchema.parse({ accessToken, refreshToken });
    // const data = await AuthService.sessionFromCookies(payload);
    // // rotate nếu có session mới
    // setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}


export async function oauthLogin(
  req: Request,
  res: Response
) {
  try {
    const payload = oauthLoginSchema.parse(req.body);
    // const data = await AuthService.oauthLogin(payload);
    // if (data.session) {
    //   setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    // } else if (data.accessToken && data.refreshToken) {
    //   setAuthCookiesFromTokens(res, data.accessToken, data.refreshToken, COOKIE_DOMAIN);
    // }
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}

export async function syncUser(
  req: Request,
  res: Response
) {
  try {
    const { user, session } = req.body ?? {};

    if (!user || !session) {
      return res.status(400).json({
        ok: false,
        error: "User and session are required",
      });
    }

    const parsedUser = syncFromSupabaseSchema.parse(user);
    // const data = await AuthService.syncUser({ user: parsedUser, session });
    // if (data.session) {
    //   setAuthCookiesFromSession(res, data.session, COOKIE_DOMAIN);
    // } else if (data.accessToken && data.refreshToken) {
    //   // Fallback if session object is missing but tokens are present
    //   setAuthCookiesFromTokens(res, data.accessToken, data.refreshToken, COOKIE_DOMAIN);
    // }
    // return res.status(200).json({ ok: true, ...data });
  } catch (e) { return handleError(res, e); }
}

export async function getUserSessions(
  req: Request,
  res: Response
) {
  try {
    const auth = (req as any).auth;
    if (!auth?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // const data = await AuthService.getUserSessions(auth.user.id);
    // return res.status(200).json({ ok: true, sessions: data });
  } catch (e) { return handleError(res, e); }
}
