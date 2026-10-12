import { cache } from "react";
import { createClient } from "./supabase/server";
import type { AIModel, Creator, CreatorSummary, CurrentUser, Prompt, PromptExample, PromptStatus, Review } from "./types";

// ---------------------------------------------------------------------------
// Row shapes and mappers
// ---------------------------------------------------------------------------

const CREATOR_COLS = "id, handle, name, avatar_hue, verified";
const LISTING_COLS = `id, slug, title, description, category, model, tags, variables, price_cents, cover_hue,
  status, featured, rejection_reason, views, sales_count, rating_avg, review_count, created_at,
  creator:profiles!prompts_creator_id_fkey(${CREATOR_COLS})`;

type CreatorRow = { id: string; handle: string; name: string; avatar_hue: number; verified: boolean };

type PromptRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  model: AIModel;
  tags: string[];
  variables: string[];
  price_cents: number;
  cover_hue: number;
  status: PromptStatus;
  featured: boolean;
  rejection_reason: string | null;
  views: number;
  sales_count: number;
  rating_avg: number | string;
  review_count: number;
  created_at: string;
  creator: CreatorRow | CreatorRow[] | null;
};

type ExampleRow = { input: Record<string, string>; output: string; position: number };

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

function toCreatorSummary(row: CreatorRow | null): CreatorSummary {
  return row
    ? { id: row.id, handle: row.handle, name: row.name || row.handle, avatarHue: row.avatar_hue, verified: row.verified }
    : { id: "", handle: "unknown", name: "Unknown", avatarHue: 0, verified: false };
}

function toPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    creator: toCreatorSummary(one(row.creator)),
    category: row.category,
    model: row.model,
    tags: row.tags,
    priceCents: row.price_cents,
    rating: Number(row.rating_avg),
    reviewCount: row.review_count,
    sales: row.sales_count,
    views: row.views,
    variables: row.variables,
    coverHue: row.cover_hue,
    createdAt: row.created_at,
    status: row.status,
    featured: row.featured,
    rejectionReason: row.rejection_reason,
  };
}

const toExamples = (rows: ExampleRow[] | null): PromptExample[] =>
  [...(rows ?? [])].sort((a, b) => a.position - b.position).map((e) => ({ input: e.input, output: e.output }));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(`${CREATOR_COLS}, bio, role`)
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    profile: { ...toCreatorSummary(profile), bio: profile.bio, role: profile.role },
  };
});

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingFilters {
  q?: string;
  category?: string;
  model?: string;
  price?: string;
  sort?: string;
  featured?: boolean;
  creatorId?: string;
  /** Restrict to any of these models (ignored if `model` is set). */
  models?: readonly string[];
  limit?: number;
}

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  trending: { column: "views", ascending: false },
  newest: { column: "created_at", ascending: false },
  top: { column: "rating_avg", ascending: false },
  "price-asc": { column: "price_cents", ascending: true },
  "price-desc": { column: "price_cents", ascending: false },
};

export async function getListings(filters: ListingFilters = {}): Promise<Prompt[]> {
  const supabase = await createClient();
  let query = supabase.from("prompts").select(LISTING_COLS).eq("status", "live");

  if (filters.q) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const term = filters.q.replace(/[,()*%\\"{}]/g, " ").trim();
    if (term) {
      const tagMatch = /\s/.test(term) ? "" : `,tags.cs.{${term.toLowerCase()}}`;
      query = query.or(`title.ilike.*${term}*,description.ilike.*${term}*${tagMatch}`);
    }
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.model) query = query.eq("model", filters.model);
  else if (filters.models?.length) query = query.in("model", [...filters.models]);
  if (filters.price === "free") query = query.eq("price_cents", 0);
  if (filters.price === "under5") query = query.lt("price_cents", 500);
  if (filters.price === "5to10") query = query.gte("price_cents", 500).lte("price_cents", 1000);
  if (filters.featured) query = query.eq("featured", true);
  if (filters.creatorId) query = query.eq("creator_id", filters.creatorId);

  const sort = SORTS[filters.sort ?? "trending"] ?? SORTS.trending;
  query = query.order(sort.column, { ascending: sort.ascending }).order("created_at", { ascending: false });
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as PromptRow[]).map(toPrompt);
}

export async function countLivePrompts() {
  const supabase = await createClient();
  const { count } = await supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "live");
  return count ?? 0;
}

export async function getFavoriteIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("prompt_id").eq("user_id", user.id);
  return (data ?? []).map((f) => f.prompt_id);
}

// ---------------------------------------------------------------------------
// Prompt page
// ---------------------------------------------------------------------------

export const getPromptPage = cache(async (slug: string) => {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: row } = await supabase.from("prompts").select(LISTING_COLS).eq("slug", slug).maybeSingle();
  if (!row) return null;
  const prompt = toPrompt(row as unknown as PromptRow);

  const [examples, reviews, secret, purchase, favorite, runsLeft] = await Promise.all([
    supabase.from("prompt_examples").select("input, output, position").eq("prompt_id", prompt.id),
    supabase
      .from("reviews")
      .select("id, user_id, rating, comment, created_at, author:profiles!reviews_user_id_fkey(handle, name, avatar_hue)")
      .eq("prompt_id", prompt.id)
      .order("created_at", { ascending: false })
      .limit(20),
    // RLS only returns the template to buyers, the creator, admins, or for free prompts.
    user ? supabase.from("prompt_secrets").select("template").eq("prompt_id", prompt.id).maybeSingle() : null,
    user
      ? supabase.from("purchases").select("id").eq("prompt_id", prompt.id).eq("buyer_id", user.id).eq("status", "paid").maybeSingle()
      : null,
    user ? supabase.from("favorites").select("prompt_id").eq("prompt_id", prompt.id).eq("user_id", user.id).maybeSingle() : null,
    user && prompt.status === "live" ? supabase.rpc("test_runs_left", { p_prompt_id: prompt.id }) : null,
  ]);

  type ReviewRow = {
    id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    author: { handle: string; name: string; avatar_hue: number } | { handle: string; name: string; avatar_hue: number }[] | null;
  };

  const reviewList: Review[] = ((reviews.data ?? []) as unknown as ReviewRow[]).map((r) => {
    const author = one(r.author);
    return {
      id: r.id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
      author: { handle: author?.handle ?? "user", name: author?.name || author?.handle || "User", avatarHue: author?.avatar_hue ?? 0 },
    };
  });

  return {
    prompt,
    examples: toExamples(examples.data as ExampleRow[] | null),
    reviews: reviewList,
    template: (secret?.data?.template as string | undefined) ?? null,
    purchased: !!purchase?.data,
    isOwner: user?.id === prompt.creator.id,
    isFavorite: !!favorite?.data,
    runsLeft: (runsLeft?.data as number | undefined) ?? null,
    user,
  };
});

export async function incrementViews(promptId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_prompt_views", { p_prompt_id: promptId });
}

export async function getPromptForCheckout(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("prompts").select(LISTING_COLS).eq("slug", slug).eq("status", "live").maybeSingle();
  return data ? toPrompt(data as unknown as PromptRow) : null;
}

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------

function creatorStats(prompts: Prompt[]) {
  const sales = prompts.reduce((s, p) => s + p.sales, 0);
  const rated = prompts.filter((p) => p.reviewCount > 0);
  const reviews = rated.reduce((s, p) => s + p.reviewCount, 0);
  const rating = reviews ? rated.reduce((s, p) => s + p.rating * p.reviewCount, 0) / reviews : 0;
  return { sales, rating: Math.round(rating * 10) / 10 };
}

export const getCreatorPage = cache(async (handle: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(`${CREATOR_COLS}, bio, created_at`)
    .eq("handle", handle)
    .maybeSingle();
  if (!profile) return null;

  const { data } = await supabase
    .from("prompts")
    .select(LISTING_COLS)
    .eq("creator_id", profile.id)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  const prompts = ((data ?? []) as unknown as PromptRow[]).map(toPrompt);

  const creator: Creator = {
    ...toCreatorSummary(profile),
    bio: profile.bio,
    joined: profile.created_at,
    ...creatorStats(prompts),
  };
  return { creator, prompts };
});

/** Creators ranked by sales across their live prompts. */
export async function getTopCreators(limit = 5): Promise<Creator[]> {
  const prompts = await getListings();
  const byCreator = new Map<string, Prompt[]>();
  for (const p of prompts) byCreator.set(p.creator.id, [...(byCreator.get(p.creator.id) ?? []), p]);

  return [...byCreator.values()]
    .map((list) => ({ ...list[0].creator, bio: "", joined: "", ...creatorStats(list) }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

export interface LibraryEntry {
  prompt: Prompt;
  template: string;
  examples: PromptExample[];
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(`created_at, prompt:prompts!purchases_prompt_id_fkey(${LISTING_COLS}, secret:prompt_secrets(template), examples:prompt_examples(input, output, position))`)
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = { prompt: (PromptRow & { secret: { template: string } | { template: string }[] | null; examples: ExampleRow[] }) | null };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.prompt)
    .map((r) => ({
      prompt: toPrompt(r.prompt!),
      template: one(r.prompt!.secret)?.template ?? "",
      examples: toExamples(r.prompt!.examples),
    }));
}

export async function getFavorites(): Promise<Prompt[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select(`created_at, prompt:prompts!favorites_prompt_id_fkey(${LISTING_COLS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  type Row = { prompt: PromptRow | null };
  return ((data ?? []) as unknown as Row[]).filter((r) => r.prompt).map((r) => toPrompt(r.prompt!));
}

// ---------------------------------------------------------------------------
// Creator dashboard
// ---------------------------------------------------------------------------

export async function getCreatorDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("prompts")
    .select(LISTING_COLS)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  const prompts = ((rows ?? []) as unknown as PromptRow[]).map(toPrompt);

  const ids = prompts.map((p) => p.id);
  const { data: sales } = ids.length
    ? await supabase
        .from("purchases")
        .select("amount_cents, platform_fee_cents, created_at")
        .in("prompt_id", ids)
        .eq("status", "paid")
    : { data: [] as { amount_cents: number; platform_fee_cents: number; created_at: string }[] };

  const netCents = (sales ?? []).reduce((s, x) => s + x.amount_cents - x.platform_fee_cents, 0);

  // Net earnings per month for the last 6 months
  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en", { month: "short" }), cents: 0 };
  });
  for (const s of sales ?? []) {
    const d = new Date(s.created_at);
    const bucket = monthly.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.cents += s.amount_cents - s.platform_fee_cents;
  }

  return { user, prompts, netCents, monthly };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface ModerationItem {
  prompt: Prompt;
  template: string;
  examples: PromptExample[];
}

export async function getModerationQueue(): Promise<ModerationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompts")
    .select(`${LISTING_COLS}, secret:prompt_secrets(template), examples:prompt_examples(input, output, position)`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  type Row = PromptRow & { secret: { template: string } | { template: string }[] | null; examples: ExampleRow[] };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    prompt: toPrompt(r),
    template: one(r.secret)?.template ?? "",
    examples: toExamples(r.examples),
  }));
}

export async function getOpenReports() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, reason, created_at, prompt:prompts!reports_prompt_id_fkey(slug, title), reporter:profiles!reports_reporter_id_fkey(handle)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    reason: string;
    created_at: string;
    prompt: { slug: string; title: string } | { slug: string; title: string }[] | null;
    reporter: { handle: string } | { handle: string }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    reason: r.reason,
    date: r.created_at,
    prompt: one(r.prompt),
    reporter: one(r.reporter)?.handle ?? "user",
  }));
}

export async function getAdminStats() {
  const supabase = await createClient();
  const [live, creators] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return { live: live.count ?? 0, users: creators.count ?? 0 };
}
