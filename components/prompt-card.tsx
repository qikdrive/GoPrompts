import Link from "next/link";
import type { Prompt } from "@/lib/types";
import { formatCompact, formatPrice } from "@/lib/utils";
import { PromptCover } from "./prompt-cover";
import { Rating } from "./rating";
import { Badge } from "./ui";
import { Avatar } from "./avatar";
import { FavoriteButton } from "./favorite-button";

export function PromptCard({ prompt, favorite = false }: { prompt: Prompt; favorite?: boolean }) {
  const { creator } = prompt;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_30px_-12px] hover:shadow-primary/40">
      <Link href={`/p/${prompt.slug}`} className="absolute inset-0 z-0" aria-label={prompt.title} />
      <PromptCover hue={prompt.coverHue} model={prompt.model} title={prompt.title} className="aspect-[16/10]" />
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton promptId={prompt.id} initial={favorite} />
      </div>
      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge>{prompt.model}</Badge>
          <span className="text-sm font-semibold text-foreground">{formatPrice(prompt.priceCents)}</span>
        </div>
        <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{prompt.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{prompt.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-muted">
            <Avatar name={creator.name} hue={creator.avatarHue} size={22} />
            <span className="truncate">@{creator.handle}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <Rating value={prompt.rating} count={prompt.reviewCount} compact />
            <span className="text-muted">{formatCompact(prompt.sales)} sold</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function PromptGrid({ prompts, favoriteIds = [] }: { prompts: Prompt[]; favoriteIds?: string[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((p) => (
        <PromptCard key={p.id} prompt={p} favorite={favoriteIds.includes(p.id)} />
      ))}
    </div>
  );
}
