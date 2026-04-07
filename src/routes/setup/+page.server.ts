import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { hash } from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "$lib/db";

export const load: PageServerLoad = async () => {
  const admin = await db
    .selectFrom("users")
    .where("username", "=", "admin")
    .select("id")
    .executeTakeFirst();

  if (admin) {
    redirect(302, "/");
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const rawPassword = data.get("password");
    const password = typeof rawPassword === "string" ? rawPassword : "";

    if (password.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters" });
    }

    const existing = await db
      .selectFrom("users")
      .where("username", "=", "admin")
      .select("id")
      .executeTakeFirst();

    if (existing) {
      return fail(400, { error: "Admin already exists" });
    }

    const id = crypto.randomUUID();
    const password_hash = await hash(password, 10);

    await db
      .insertInto("users")
      .values({
        id,
        username: "admin",
        password_hash,
        created_at: Date.now(),
      })
      .execute();

    const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ id, username: "admin" })
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

    redirect(302, "/admin");
  },
};
