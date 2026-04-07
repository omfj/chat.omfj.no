import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { db } from "$lib/db";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    error(401, "Unauthorized");
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    error(400, "Content is required");
  }

  await db
    .insertInto("messages")
    .values({
      id: crypto.randomUUID(),
      user_id: locals.user.id,
      role: "user",
      content,
      created_at: Date.now(),
    })
    .execute();

  return json({ ok: true });
};
