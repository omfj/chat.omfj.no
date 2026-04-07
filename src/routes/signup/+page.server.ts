import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { hash } from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "$lib/db";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(302, locals.user.username === "admin" ? "/admin" : "/chat");
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const rawUsername = data.get("username");
    const rawPassword = data.get("password");
    const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";

    if (!username || !password) {
      return fail(400, { error: "Username and password are required" });
    }

    if (username === "admin") {
      return fail(400, { error: "That username is reserved" });
    }

    if (username.length < 3 || username.length > 32) {
      return fail(400, { error: "Username must be 3–32 characters" });
    }

    if (password.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters" });
    }

    const existing = (await db
      .selectFrom("users")
      .where("username", "=", username)
      .select("id")
      .executeTakeFirst()) as { id: string } | undefined;

    if (existing) {
      return fail(400, { error: "Username already taken" });
    }

    const id = crypto.randomUUID();
    const password_hash = await hash(password, 10);

    await db
      .insertInto("users")
      .values({
        id,
        username,
        password_hash,
        created_at: Date.now(),
      })
      .execute();

    const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ id, username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(key);

    cookies.set("session", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(302, "/chat");
  },
};
