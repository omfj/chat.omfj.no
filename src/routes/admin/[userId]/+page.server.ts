import type { PageServerLoad } from "./$types";
import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { UsersTable, MessagesTable } from "$lib/db/types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user || locals.user.username !== "admin") {
    error(403, "Forbidden");
  }

  const targetUser = (await db
    .selectFrom("users")
    .where("id", "=", params.userId)
    .selectAll()
    .executeTakeFirst()) as UsersTable | undefined;

  if (!targetUser) {
    error(404, "User not found");
  }

  const messages = (await db
    .selectFrom("messages")
    .where("user_id", "=", params.userId)
    .orderBy("created_at", "asc")
    .selectAll()
    .execute()) as MessagesTable[];

  return { targetUser, messages };
};
