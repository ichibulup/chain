/// <reference types="node" />

// Type declarations for Express API
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPRESS_PORT?: string;
      EXPRESS_ENV?: string;
      EXPRESS_NODE_ENV?: string;
      EXPRESS_PUBLIC_SUPABASE_URL?: string;
      EXPRESS_PUBLIC_SUPABASE_ANON_KEY?: string;
      EXPRESS_PRIVATE_SUPABASE_URL?: string;
      EXPRESS_PRIVATE_SUPABASE_DIRECT_URL?: string;
      EXPRESS_PRIVATE_SUPABASE_SERVICE_ROLE_KEY?: string;
    }
  }
}

// Ensure PrismaClient types are available
export {};

