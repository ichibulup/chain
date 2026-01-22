// import "dotenv/config";
import dotenv from "dotenv";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client/index'

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

if (!isProduction) {
  dotenv.config({
    path: ".env.local",
    override: true,
    debug: false,
    quiet: true
  })
}

const logConnectionInfo = (label: string, url?: string) => {
  if (!url) {
    console.warn(`[prisma] ${label}: not set`);
    return;
  }

  try {
    const parsed = new URL(url);
    const dbName = parsed.pathname.replace("/", "") || "(default)";
    const sslmode = parsed.searchParams.get("sslmode") ?? "default";
    const pgbouncer = parsed.searchParams.get("pgbouncer") ?? "false";
    const port = parsed.port || "5432";
    const user = parsed.username || "unknown";

    console.log(
      `[prisma] ${label}: host=${parsed.hostname} port=${port} db=${dbName} user=${user} sslmode=${sslmode} pgbouncer=${pgbouncer}`
    );
  } catch (error) {
    console.warn(`[prisma] ${label}: invalid connection string`);
  }
};
// const connectionString = `${process.env.EXPRESS_PRIVATE_SUPABASE_DEMO_URL}`;
const pooledUrl = process.env.EXPRESS_PRIVATE_SUPABASE_URL;
const directUrl = process.env.EXPRESS_PRIVATE_SUPABASE_DIRECT_URL;
const connectionString = isProduction
  ? (pooledUrl || directUrl)
  : (directUrl || pooledUrl);

if (!connectionString) {
  throw new Error("Missing Supabase connection string. Set EXPRESS_PRIVATE_SUPABASE_URL or EXPRESS_PRIVATE_SUPABASE_DIRECT_URL.");
}

const selectedSource = connectionString === pooledUrl
  ? "EXPRESS_PRIVATE_SUPABASE_URL"
  : connectionString === directUrl
    ? "EXPRESS_PRIVATE_SUPABASE_DIRECT_URL"
    : "unknown";

console.log(`[prisma] runtime: node_env=${process.env.NODE_ENV ?? "unknown"} vercel=${process.env.VERCEL ?? "false"} selected=${selectedSource}`);
logConnectionInfo("EXPRESS_PRIVATE_SUPABASE_URL", pooledUrl);
logConnectionInfo("EXPRESS_PRIVATE_SUPABASE_DIRECT_URL", directUrl);
logConnectionInfo("selected", connectionString);

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }


// import { PrismaClient } from '@prisma/client/index';

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// // Prisma Client singleton pattern for serverless environments
// // In serverless (Vercel), each function invocation may reuse the same container,
// // so we use global to prevent multiple Prisma Client instances
// let prisma: PrismaClient;

// if (process.env.NODE_ENV === 'production') {
//   // Production: create a single instance with optimized connection pool
//   prisma = global.prisma ?? new PrismaClient({
//     log: ['error'],
//     datasources: {
//       db: {
//         url: process.env.EXPRESS_PRIVATE_SUPABASE_URL,
//       },
//     },
//   });
//   if (!global.prisma) {
//     global.prisma = prisma;
//   }
// } else {
//   // Development: create a new instance with connection pool
//   prisma = global.prisma ?? new PrismaClient({
//     log: process.env.EXPRESS_NODE_ENV === "development" ? ["error", "warn"] : ["error"],
//     datasources: {
//       db: {
//         url: process.env.EXPRESS_PRIVATE_SUPABASE_URL,
//       },
//     },
//   });
//   if (!global.prisma) {
//     global.prisma = prisma;
//   }
// }

// export default prisma;

// import { PrismaClient } from '@prisma/client/index';
//
// declare global {
//   var prisma: PrismaClient | undefined;
// }
//
// // export const prisma =
// //   global.prisma ?? new PrismaClient({
// //     log: process.env.EXPRESS_NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
// //   });
// //
// // if (process.env.EXPRESS_NODE_ENV !== "production") global.prisma = prisma;
//
// let prisma: PrismaClient;
// if (!global.prisma) {
//   global.prisma = new PrismaClient();
// }
// prisma = global.prisma;
//
// export default prisma;
