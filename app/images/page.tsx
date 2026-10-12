import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { imageModels } from "@/lib/constants";
import { getFavoriteIds, getListings } from "@/lib/queries";
import { ImagePromptCard } from "@/components/image-prompt-card";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Image prompts",
  description: "Prompts for Midjourney, Stable Diffusion and DALL·E.",
};

const sorts = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "top", label: "Top rated" },
];

type SearchParams = Promise<{ model?: string; sort?: string }>;

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-muted hover:border-primary/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export default async function ImagePromptsPage({ searchParams }: { searchParams: SearchParams }) {
  const { model: modelParam, sort: sortParam } = await searchParams;
  const model = (imageModels as readonly string[]).includes(modelParam ?? "") ? modelParam : undefined;
  const sort = sorts.some((s) => s.value === sortParam) ? sortParam! : "trending";

  const [prompts, favoriteIds] = await Promise.all([
    getListings({ models: imageModels, model, sort }),
    getFavoriteIds(),
  ]);

  const href = (next: { model?: string; sort?: string }) => {
    const params = new URLSearchParams();
    const m = "model" in next ? next.model : model;
    const s = "sort" in next ? next.sort : sort;
    if (m) params.set("model", m);
    if (s && s !== "trending") params.set("sort", s);
    const qs = params.toString();
    return `/images${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ImageIcon size={24} className="text-primary" /> Image prompts
          </h1>
          <p className="mt-1 text-sm text-muted">
            Prompts for Midjourney, Stable Diffusion and DALL·E. {prompts.length} prompts
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {sorts.map((s) => (
            <Link
              key={s.value}
              href={href({ sort: s.value })}
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                sort === s.value ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Chip href={href({ model: undefined })} active={!model}>All</Chip>
        {imageModels.map((m) => (
          <Chip key={m} href={href({ model: m })} active={model === m}>{m}</Chip>
        ))}
      </div>

      {prompts.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {prompts.map((p) => (
            <ImagePromptCard key={p.id} prompt={p} favorite={favoriteIds.includes(p.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <ImageIcon size={40} className="text-muted" />
          <h2 className="mt-4 font-semibold">No image prompts yet</h2>
          <p className="mt-1 text-sm text-muted">Be the first to list one.</p>
          <Link href="/sell/new" className={buttonClass("primary", "md", "mt-5")}>Sell an image prompt</Link>
        </div>
      )}
    </div>
  );
}
