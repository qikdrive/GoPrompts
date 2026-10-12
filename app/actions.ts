"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import { categories, models } from "@/lib/constants";
import { extractVariables } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";

/** Only allow same-site relative redirects. */
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password,
    options: {
      data: { name: String(formData.get("name") ?? "") },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };

  // Email confirmation disabled in Supabase → signed in immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return { message: "Check your email for a confirmation link to finish signing up." };
}

export async function signInWithGoogleAction(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`);
  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Buyer actions
// ---------------------------------------------------------------------------

export async function toggleFavoriteAction(promptId: string, favorite: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" as const };
  const supabase = await createClient();
  const { error } = favorite
    ? await supabase.from("favorites").upsert({ user_id: user.id, prompt_id: promptId }, { ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("prompt_id", promptId);
  if (error) return { error: error.message };
  revalidatePath("/library");
  return { favorite };
}

export async function acquirePromptAction(promptId: string, slug: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/p/${slug}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("acquire_prompt", { p_prompt_id: promptId });
  if (error) return { error: error.message };
  revalidatePath(`/p/${slug}`);
  revalidatePath("/library");
  return { message: "ok" };
}

export async function runTestAction(promptId: string, values: Record<string, string>) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to try prompts." };
  const supabase = await createClient();

  const { data: runsLeft, error } = await supabase.rpc("record_test_run", { p_prompt_id: promptId });
  if (error) return { error: error.message };

  // TODO: call the LLM. That needs a server-only Supabase secret key to read the
  // hidden template (buyers can't read it through RLS) plus an LLM API key.
  // Until then, return the creator's first example output.
  void values;
  const { data: example } = await supabase
    .from("prompt_examples")
    .select("output")
    .eq("prompt_id", promptId)
    .order("position")
    .limit(1)
    .maybeSingle();

  return { output: example?.output ?? "No preview available.", runsLeft: runsLeft as number };
}

export async function submitReviewAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to leave a review." };
  const promptId = String(formData.get("promptId"));
  const slug = String(formData.get("slug"));
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!(rating >= 1 && rating <= 5)) return { error: "Pick a rating from 1 to 5 stars." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .upsert({ prompt_id: promptId, user_id: user.id, rating, comment }, { onConflict: "prompt_id,user_id" });
  if (error) return { error: error.code === "42501" ? "Only buyers can review this prompt." : error.message };
  revalidatePath(`/p/${slug}`);
  return { message: "Thanks for your review!" };
}

export async function reportPromptAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to report a listing." };
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { error: "Tell us what's wrong." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ prompt_id: String(formData.get("promptId")), reporter_id: user.id, reason });
  if (error) return { error: error.message };
  return { message: "Thanks. Our team will review this listing." };
}

// ---------------------------------------------------------------------------
// Creator actions
// ---------------------------------------------------------------------------

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "prompt"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createListingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to create a listing." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const model = String(formData.get("model") ?? "");
  const template = String(formData.get("template") ?? "").trim();
  const priceCents = Math.round(Number(formData.get("price") ?? 0) * 100);
  const status = formData.get("intent") === "draft" ? "draft" : "pending";
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
  const outputs = formData.getAll("example").map(String).map((s) => s.trim()).filter(Boolean);

  if (title.length < 3) return { error: "Title must be at least 3 characters." };
  if (description.length < 10) return { error: "Description must be at least 10 characters." };
  if (!categories.some((c) => c.slug === category)) return { error: "Pick a category." };
  if (!(models as readonly string[]).includes(model)) return { error: "Pick an AI model." };
  if (template.length < 10) return { error: "The prompt must be at least 10 characters." };
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 100000) return { error: "Price must be between $0 and $1,000." };
  if (status === "pending" && outputs.length === 0) return { error: "Add at least one example output." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_listing", {
    p_slug: slugify(title),
    p_title: title,
    p_description: description,
    p_category: category,
    p_model: model,
    p_tags: tags,
    p_variables: extractVariables(template),
    p_price_cents: priceCents,
    p_cover_hue: Math.floor(Math.random() * 360),
    p_status: status,
    p_template: template,
    p_examples: outputs.map((output) => ({ input: {}, output })),
  });
  if (error) return { error: error.message };

  revalidatePath("/sell");
  redirect(`/sell?created=${status}`);
}

// ---------------------------------------------------------------------------
// Admin actions (RLS + the guard trigger enforce admin-only status changes)
// ---------------------------------------------------------------------------

export async function moderatePromptAction(promptId: string, decision: "live" | "rejected", reason?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prompts")
    .update({ status: decision, rejection_reason: decision === "rejected" ? reason || "Did not meet listing guidelines" : null })
    .eq("id", promptId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath("/");
  return {};
}

export async function resolveReportAction(reportId: string, status: "resolved" | "dismissed") {
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}
