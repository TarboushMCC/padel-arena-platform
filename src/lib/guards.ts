import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export function requireUser() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user?.id) {
      redirect("/login");
    }
    return session;
  });
}

export function requireAdminSession() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user?.id) {
      redirect("/login");
    }
    if (session.user.role !== "admin") {
      redirect("/");
    }
    return session;
  });
}
