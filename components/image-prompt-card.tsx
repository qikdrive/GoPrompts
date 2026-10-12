import Link from "next/link";
import { Star } from "lucide-react";
import type { Prompt } from "@/lib/types";
import { formatCompact, formatPrice } from "@/lib/utils";
import { PromptCover } from "./prompt-cover";
import { Avatar } from "./avatar";
import { FavoriteButton } from "./favorite-button";

/** Full-bleed 9:16 card for the image feed, with info overlaid like a story/reel. */
export function ImagePromptCard({ prompt, favorite = false }: { prompt: Prompt; favorite?: boolean }) {
  const { creator } = prompt;
  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
        <PromptCover hue={prompt.coverHue} model={prompt.model} title="" className="h-full w-full" />
      </div>
      {/* Scrims keep overlaid text readable on any cover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <Link href={`/p/${prompt.slug}`} className="absolute inset-0 z-0" aria-label={prompt.title} />

      <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
        {prompt.model}
      </div>
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton promptId={prompt.id} initial={favorite} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 p-3 text-white sm:p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold sm:text-base">{prompt.title}</h3>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <Avatar name={creator.name} hue={creator.avatarHue} size={20} />
          <span className="truncate">@{creator.handle}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-black">{formatPrice(prompt.priceCents)}</span>
          <span className="flex items-center gap-2 text-white/80">
            {prompt.reviewCount > 0 ? (
              <span className="flex items-center gap-0.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" /> {prompt.rating.toFixed(1)}
              </span>
            ) : (
              <span>New</span>
            )}
            <span>{formatCompact(prompt.sales)} sold</span>
          </span>
        </div>
      </div>
    </div>
  );
}
