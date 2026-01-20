// import "dotenv/config";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: ".env.local",
  override: true,
  debug: false,
  quiet: true
})

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  // engine: "classic",
  datasource: {
    url: env("EXPRESS_PRIVATE_SUPABASE_URL"), // pgBouncer pooling URL
    // directUrl: env("EXPRESS_PRIVATE_SUPABASE_DIRECT_URL"), // Direct URL cho migrations
  },
});
