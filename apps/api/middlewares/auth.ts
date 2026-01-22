import type { Request, Response, NextFunction } from "express";
import { createServerClient } from "@supabase/ssr";
import { syncFromSupabase } from "@/services/user";
import { UserRole, RestaurantStaffRole } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/client";
import { prisma } from "@/lib/prisma";

export type WithAuthOptions = {
  /** Yêu cầu global role (optional) */
  role?: Array<UserRole | string>; // ví dụ: [UserRole.admin, UserRole.master] hoặc ["admin"]
  /** Yêu cầu role trong restaurant (optional) */
  restaurantRole?: Array<RestaurantStaffRole | string>;
  /** Tùy biến cách lấy restaurantId từ request */
  selectRestaurantId?: (req: Request) => string | undefined;
};

type RequireAuthParam = Array<UserRole | string> | WithAuthOptions | undefined;

function isLikelyJwt(token?: string) {
  if (!token) return false;
  const lower = token.toLowerCase();
  if (lower === "undefined" || lower === "null") return false;
  if (token.includes("[object")) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function pickAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization || req.headers.Authorization;
  const h = typeof header === "string" ? header : undefined;
  if (h?.startsWith("Bearer ")) {
    const token = h.slice(7).trim();
    if (isLikelyJwt(token)) return token;
  }
  return undefined;
}

function normalizeOptions(param?: RequireAuthParam): WithAuthOptions {
  if (!param) return {};
  if (Array.isArray(param)) return { role: param };
  return param;
}

function resolveUserRole(params: { dbUser?: { role?: UserRole | null } | null; authUser?: any }) {
  if (params.dbUser?.role) return params.dbUser.role;
  const authRole = params.authUser?.app_metadata?.role ?? params.authUser?.user_metadata?.role;
  return typeof authRole === "string" ? (authRole as UserRole) : null;
}

function createSupabaseServerClient(req: Request, res: Response) {
  return createServerClient(
    process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
    process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookies = (req as any).cookies as Record<string, string> | undefined;
          if (!cookies) return [];
          return Object.entries(cookies).map(([name, value]) => ({ name, value }));
        },
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookie(name, value, options);
          });
        },
      },
    }
  );
}

/** Middleware chính: xác thực Supabase access token, attach req.auth & req.dbUser, kiểm tra quyền nếu truyền options */
export function withAuth(options?: WithAuthOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supabase = createSupabaseServerClient(req, res);
      const headerToken = pickAccessToken(req);
      const { data: sessionData } = headerToken
        ? { data: { session: null } }
        : await supabase.auth.getSession();

      const session = sessionData?.session ?? null;
      const accessToken = headerToken ?? session?.access_token ?? undefined;
      if (!accessToken) return res.status(401).json({ ok: false, error: "Unauthorized" });

      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

      const dbUser = await syncFromSupabase(data.user);

      // Gắn vào req giống Clerk
      (req as any).auth = { userId: data.user.id, session: { accessToken }, user: data.user };
      (req as any).userId = data.user.id;
      (req as any).dbUser = dbUser;

      // Kiểm tra global role nếu yêu cầu
      if (options?.role?.length) {
        const currentRole = resolveUserRole({
          dbUser: dbUser ? { role: dbUser.role as UserRole } : undefined,
          authUser: data.user,
        });
        const allowedRoles = options.role.map((role) => String(role));
        if (!currentRole || !allowedRoles.includes(String(currentRole))) {
          return res.status(403).json({ ok: false, error: "Forbidden" });
        }
      }

      // Kiểm tra restaurant role nếu yêu cầu
      if (options?.restaurantRole?.length) {
        const getRestaurantId =
          options.selectRestaurantId ??
          ((r: Request) =>
            (r.params as any).restaurantId ||
            (r.query as any).restaurantId ||
            (r.body as any).restaurantId);
        const restaurantId = getRestaurantId(req);
        if (!restaurantId) {
          return res.status(400).json({ ok: false, error: "Missing restaurantId" });
        }
        const allowedRestaurantRoles = options.restaurantRole.map((role) => String(role)) as RestaurantStaffRole[];
        const membership = await prisma.restaurantUserRole.findFirst({
          where: {
            userId: dbUser.id,
            restaurantId,
            role: { in: allowedRestaurantRoles },
          },
          select: { id: true },
        });
        if (!membership) return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Internal Server Error" });
    }
  };
}

export function requireAuth(param?: RequireAuthParam) {
  const options = normalizeOptions(param);
  return withAuth(options);
}

export async function requireSupabaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const supabase = createClient()
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // gắn user vào req để dùng ở route
    (req as any).user = data.user;

    return next();
  } catch (e) {
    return res.status(500).json({ error: "Auth middleware error" });
  }
}

// ---------- Next.js middleware (Edge) ----------
// import { NextRequest, NextResponse } from "next/server";
//
// // Cấu hình route public
// const PUBLIC_PATHS = [
//   "/",
//   "/sign-in",
//   "/sign-up",
//   "/auth/callback",
//   "/api/auth/oauth/callback",
//   "/public",
// ];
//
// // Helper: kiểm tra path có phải public không
// function isPublicPath(pathname: string) {
//   return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
// }
//
// /**
//  * withAuth:
//  * - Đọc cookie __session / __refresh
//  * - Gọi nội bộ tới API `/api/auth/session` để validate/refresh như Clerk
//  * - Nếu unauthorized: redirect về /sign-in (hoặc trả 401 cho API)
//  */
// export function withAuth(
//   request: NextRequest,
//   opts: { signInPath?: string; apiPrefix?: string } = {}
// ) {
//   const signInPath = opts.signInPath ?? "/sign-in";
//   const apiPrefix = opts.apiPrefix ?? "/api";
//
//   const { pathname } = request.nextUrl;
//   // Cho phép public paths + assets + _next
//   if (
//     isPublicPath(pathname) ||
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/favicon") ||
//     pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
//   ) {
//     return NextResponse.next();
//   }
//
//   // Nếu là API route, khi không có cookie thì trả 401
//   const isApi = pathname.startsWith(apiPrefix);
//
//   // Gọi tới endpoint session để xác thực và đồng thời rotate cookie
//   const url = request.nextUrl.clone();
//   url.pathname = "/api/auth/session";
//
//   return fetch(url, {
//     method: "GET",
//     headers: {
//       cookie: request.headers.get("cookie") || "",
//     },
//   })
//     .then(async (r) => {
//       if (r.ok) {
//         // Lấy set-cookie từ response để forward (rotate access)
//         const res = NextResponse.next();
//         const setCookie = r.headers.get("set-cookie");
//         if (setCookie) res.headers.set("set-cookie", setCookie);
//         return res;
//       }
//       if (isApi) {
//         return new NextResponse(JSON.stringify({ ok: false, error: "Unauthorized" }), {
//           status: 401,
//           headers: { "content-type": "application/json" },
//         });
//       }
//       const redirectUrl = request.nextUrl.clone();
//       redirectUrl.pathname = signInPath;
//       redirectUrl.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
//       return NextResponse.redirect(redirectUrl);
//     })
//     .catch(() => {
//       if (isApi) {
//         return new NextResponse(JSON.stringify({ ok: false, error: "Unauthorized" }), {
//           status: 401,
//           headers: { "content-type": "application/json" },
//         });
//       }
//       const redirectUrl = request.nextUrl.clone();
//       redirectUrl.pathname = signInPath;
//       redirectUrl.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
//       return NextResponse.redirect(redirectUrl);
//     });
// }
