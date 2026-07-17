"use server";

import { cookies } from "next/headers";

const COOKIE = "nf3_shell_outlet";
const MAX_AGE = 60 * 60 * 24 * 30;

export async function setShellOutletAction(slug: string) {
  cookies().set(COOKIE, slug, {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax"
  });
}
