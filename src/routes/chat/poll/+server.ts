import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { db } from "$lib/db";
import type { MessagesTable } from "$lib/db/types";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    error(401, "Unauthorized");
  }

  const since = Number(url.searchParams.get("since") ?? "0");
  const messages = (await db
    .selectFrom("messages")
    .where("user_id", "=", locals.user.id)
    .where("role", "=", "admin")
    .where("created_at", ">", since)
    .orderBy("created_at", "asc")
    .selectAll()
    .execute()) as MessagesTable[];

  return json(messages);
};
