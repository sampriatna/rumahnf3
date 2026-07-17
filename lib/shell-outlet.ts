import { cookies } from "next/headers";

const COOKIE = "nf3_shell_outlet";

export function readShellOutletCookie(): string | undefined {
  return cookies().get(COOKIE)?.value;
}
