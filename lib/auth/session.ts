import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth>>>;

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session as AuthSession;
}
