import { createClient } from "@supabase/supabase-js";
import type { Server as SocketIOServer } from "socket.io";
import { models } from "@/lib/constants";
import { Logging } from "@/lib/logging";

export async function createRealtime(
  // io: SocketIOServer,
  // tables: string[]
) {
  const supabase = createClient(
    process.env.EXPRESS_PUBLIC_SUPABASE_URL!,
    // process.env.EXPRESS_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!,
    process.env.EXPRESS_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
    }
  )

  models.forEach((table) => {
    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table
        },
        (payload) => {
          if (payload.errors?.length) {
            console.error(Logging(`[Realtime] ${table} subscription error: ${payload.errors}`, 'error', 'red'));
            return;
          }

          console.log(Logging(`[Realtime] Change in ${table}: ${payload}`, "info", "cyan"));

          // Broadcast to all Socket.IO clients
          // io.emit("supabase", {
          //   table,
          //   data: payload,
          // });
        }
      );

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(Logging(`[Realtime] ${table} channel status: ${status}`, 'error', 'red'));
      }
    });
  });
}
