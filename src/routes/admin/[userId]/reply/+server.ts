import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { db } from "$lib/db";

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.username !== "admin") {
    error(403, "Forbidden");
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    error(400, "Content is required");
  }

  const targetUser = (await db
    .selectFrom("users")
    .where("id", "=", params.userId)
    .select("id")
    .executeTakeFirst()) as { id: string } | undefined;

  if (!targetUser) {
    error(404, "User not found");
  }

  await db
    .insertInto("messages")
    .values({
      id: crypto.randomUUID(),
      user_id: params.userId,
      role: "admin",
      content,
      created_at: Date.now(),
    })
    .execute();

  return json({ ok: true });
};
