import type { PageServerLoad } from "./$types";
import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { MessagesTable } from "$lib/db/types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    error(401, "Unauthorized");
  }

  const messages = (await db
    .selectFrom("messages")
    .where("user_id", "=", locals.user.id)
    .orderBy("created_at", "asc")
    .selectAll()
    .execute()) as MessagesTable[];

  return {
    user: locals.user,
    messages,
  };
};
