import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Pintu masuk: arahkan ke dashboard bila sudah login, selain itu ke halaman login.
export default function HomePage() {
  if (getSession()) {
    redirect("/dashboard");
  }
  redirect("/login");
}
