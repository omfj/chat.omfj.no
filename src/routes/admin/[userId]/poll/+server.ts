import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { db } from "$lib/db";
import type { MessagesTable } from "$lib/db/types";

export const GET: RequestHandler = async ({ locals, params, url }) => {
  if (!locals.user || locals.user.username !== "admin") {
    error(403, "Forbidden");
  }

  const since = Number(url.searchParams.get("since") ?? "0");

  const messages = (await db
    .selectFrom("messages")
    .where("user_id", "=", params.userId)
    .where("role", "=", "user")
    .where("created_at", ">", since)
    .orderBy("created_at", "asc")
    .selectAll()
    .execute()) as MessagesTable[];

  return json(messages);
};
