import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth/config";

export type AuthSession = Session & { user: { id: string } };

export async function requireAuth(): Promise<AuthSession> {
  const session = (await auth()) as AuthSession | null;
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
