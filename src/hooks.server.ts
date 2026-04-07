import type { Handle } from "@sveltejs/kit";
import { jwtVerify } from "jose";
import { redirect } from "@sveltejs/kit";
import { building } from "$app/environment";
import { db, runMigration } from "$lib/db";

const AUTH_COOKIE = "session";

if (!building) {
  runMigration();
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;

  const token = event.cookies.get(AUTH_COOKIE);

  if (token) {
    try {
      const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
      const key = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, key);
      const id = payload.id as string;
      const username = payload.username as string;

      const user = await db!
        .selectFrom("users")
        .where("id", "=", id)
        .where("username", "=", username)
        .select("id")
        .executeTakeFirst();

      if (user) {
        event.locals.user = { id, username };
      } else {
        event.cookies.delete(AUTH_COOKIE, { path: "/" });
      }
    } catch {
      event.cookies.delete(AUTH_COOKIE, { path: "/" });
    }
  }

  const path = event.url.pathname;
  const user = event.locals.user;

  // Protect /chat routes
  if (path.startsWith("/chat") && !user) {
    redirect(302, "/login");
  }

  // Protect /admin routes
  if (path.startsWith("/admin") && !user) {
    redirect(302, "/login");
  }

  // Only the admin user may access /admin
  if (path.startsWith("/admin") && user?.username !== "admin") {
    redirect(302, "/chat");
  }

  // Redirect authenticated non-admin users away from login/signup
  if ((path === "/login" || path === "/signup") && user) {
    redirect(302, user.username === "admin" ? "/admin" : "/chat");
  }

  return resolve(event);
};
