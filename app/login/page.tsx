import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next = "/", error } = await searchParams;
  if (await getCurrentUser()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  return <AuthForm mode="login" next={next} error={error} />;
}
