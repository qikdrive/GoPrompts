import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, ShoppingBag, Star } from "lucide-react";
import { getCreatorPage, getFavoriteIds } from "@/lib/queries";
import { formatCompact, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { PromptGrid } from "@/components/prompt-card";

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await getCreatorPage((await params).handle);
  return page ? { title: `${page.creator.name} (@${page.creator.handle})` } : {};
}

export default async function CreatorPage({ params }: { params: Params }) {
  const [page, favoriteIds] = await Promise.all([getCreatorPage((await params).handle), getFavoriteIds()]);
  if (!page) notFound();
  const { creator, prompts } = page;

  return (
    <>
      <div
        className="h-40 border-b border-border sm:h-52"
        style={{
          background: `linear-gradient(120deg, hsl(${creator.avatarHue} 60% 25%), hsl(${(creator.avatarHue + 60) % 360} 60% 15%))`,
        }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar name={creator.name} hue={creator.avatarHue} size={104} className="ring-4 ring-background" />
          <div className="pb-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {creator.name}
              {creator.verified && <BadgeCheck size={22} className="text-accent" />}
            </h1>
            <p className="text-muted">@{creator.handle}</p>
          </div>
        </div>

        {creator.bio && <p className="mt-6 max-w-2xl text-foreground/90">{creator.bio}</p>}
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted">
          {creator.rating > 0 && (
            <span className="flex items-center gap-1.5"><Star size={15} className="fill-warning text-warning" /> {creator.rating} rating</span>
          )}
          <span className="flex items-center gap-1.5"><ShoppingBag size={15} /> {formatCompact(creator.sales)} sales</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={15} /> Joined {formatDate(creator.joined)}</span>
        </div>

        <h2 className="mt-12 mb-6 text-xl font-semibold">Prompts ({prompts.length})</h2>
        {prompts.length ? (
          <PromptGrid prompts={prompts} favoriteIds={favoriteIds} />
        ) : (
          <p className="text-sm text-muted">No live prompts yet.</p>
        )}
      </div>
    </>
  );
}
