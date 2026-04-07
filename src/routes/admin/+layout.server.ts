import type { LayoutServerLoad } from "./$types";
import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { UsersTable, MessagesTable } from "$lib/db/types";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  depends("app:sidebar");
  if (!locals.user || locals.user.username !== "admin") {
    error(403, "Forbidden");
  }

  const users = (await db
    .selectFrom("users")
    .where("username", "!=", "admin")
    .orderBy("created_at", "asc")
    .selectAll()
    .execute()) as UsersTable[];

  const conversations = await Promise.all(
    users.map(async (user) => {
      const lastMessage = (await db
        .selectFrom("messages")
        .where("user_id", "=", user.id)
        .orderBy("created_at", "desc")
        .limit(1)
        .selectAll()
        .executeTakeFirst()) as MessagesTable | undefined;

      const lastAdminReply = (await db
        .selectFrom("messages")
        .where("user_id", "=", user.id)
        .where("role", "=", "admin")
        .orderBy("created_at", "desc")
        .limit(1)
        .select("created_at")
        .executeTakeFirst()) as { created_at: number } | undefined;

      let unreadCount: number;
      if (lastAdminReply) {
        const result = (await db
          .selectFrom("messages")
          .where("user_id", "=", user.id)
          .where("role", "=", "user")
          .where("created_at", ">", lastAdminReply.created_at)
          .select((eb) => eb.fn.count("id").as("count"))
          .executeTakeFirst()) as { count: number } | undefined;
        unreadCount = result?.count ?? 0;
      } else {
        const result = (await db
          .selectFrom("messages")
          .where("user_id", "=", user.id)
          .where("role", "=", "user")
          .select((eb) => eb.fn.count("id").as("count"))
          .executeTakeFirst()) as { count: number } | undefined;
        unreadCount = result?.count ?? 0;
      }

      return {
        user,
        lastMessage: lastMessage ?? null,
        unreadCount,
      };
    }),
  );

  conversations.sort((a, b) => {
    const ta = a.lastMessage?.created_at ?? a.user.created_at;
    const tb = b.lastMessage?.created_at ?? b.user.created_at;
    return tb - ta;
  });

  return { conversations };
};
