import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Sign up" };

type SearchParams = Promise<{ next?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { next = "/" } = await searchParams;
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" next={next} />;
}
