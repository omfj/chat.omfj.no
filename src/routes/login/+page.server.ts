import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "$lib/db";
import type { UsersTable } from "$lib/db/types";

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

    const user = (await db
      .selectFrom("users")
      .where("username", "=", username)
      .selectAll()
      .executeTakeFirst()) as UsersTable | undefined;

    if (!user) {
      return fail(400, { error: "Invalid username or password" });
    }

    const valid = await compare(password, user.password_hash);
    if (!valid) {
      return fail(400, { error: "Invalid username or password" });
    }

    const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ id: user.id, username: user.username })
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

    redirect(302, username === "admin" ? "/admin" : "/chat");
  },
};
