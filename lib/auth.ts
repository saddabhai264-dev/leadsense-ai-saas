import { auth } from "@/auth";

export async function getUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
