import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { AlertTriangle, BadgeCheck, Eye, Lock, RotateCcw, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCategory } from "@/lib/constants";
import { getFavoriteIds, getListings, getPromptPage, incrementViews } from "@/lib/queries";
import { formatCompact, formatDate, formatPrice } from "@/lib/utils";
import { PromptCover } from "@/components/prompt-cover";
import { Rating, Stars } from "@/components/rating";
import { Avatar } from "@/components/avatar";
import { Badge, buttonClass, Card } from "@/components/ui";
import { TryRunner } from "@/components/try-runner";
import { FavoriteButton } from "@/components/favorite-button";
import { CopyButton } from "@/components/copy-button";
import { PromptGrid } from "@/components/prompt-card";
import { GetFreeButton, ReportButton, ReviewForm } from "@/components/prompt-actions";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await getPromptPage((await params).slug);
  return page ? { title: page.prompt.title, description: page.prompt.description } : {};
}

export default async function PromptPage({ params }: { params: Params }) {
  const page = await getPromptPage((await params).slug);
  if (!page) notFound();

  const { prompt, examples, reviews, template, purchased, isOwner, isFavorite, runsLeft, user } = page;
  const creator = prompt.creator;
  const category = getCategory(prompt.category);
  const isFree = prompt.priceCents === 0;
  const unlocked = template !== null;
  const myReview = user ? reviews.find((r) => r.userId === user.id) : undefined;

  if (prompt.status === "live" && !isOwner) after(() => incrementViews(prompt.id));

  const [creatorPrompts, favoriteIds] = await Promise.all([
    getListings({ creatorId: creator.id, sort: "trending", limit: 5 }),
    getFavoriteIds(),
  ]);
  const more = creatorPrompts.filter((p) => p.id !== prompt.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/browse" className="hover:text-foreground">Browse</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/browse?category=${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      {prompt.status !== "live" && (
        <div className="mb-6 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle size={18} className="shrink-0 text-warning" />
          <div>
            <div className="font-medium">
              {prompt.status === "pending" && "This listing is waiting for review. Only you and admins can see it."}
              {prompt.status === "draft" && "This listing is a draft. Only you can see it."}
              {prompt.status === "rejected" && "This listing was rejected."}
            </div>
            {prompt.rejectionReason && <div className="mt-1 text-muted">Reason: {prompt.rejectionReason}</div>}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-8">
          <PromptCover
            hue={prompt.coverHue}
            model={prompt.model}
            title=""
            className="aspect-[21/9] rounded-2xl border border-border"
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{prompt.model}</Badge>
              {prompt.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{prompt.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <Rating value={prompt.rating} count={prompt.reviewCount} />
              <span className="flex items-center gap-1"><ShoppingBag size={14} /> {formatCompact(prompt.sales)} sold</span>
              <span className="flex items-center gap-1"><Eye size={14} /> {formatCompact(prompt.views)} views</span>
              <span>Added {formatDate(prompt.createdAt)}</span>
            </div>
            <p className="mt-5 leading-relaxed text-foreground/90">{prompt.description}</p>
          </div>

          {/* Prompt (locked or unlocked) */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">The prompt</h2>
              {unlocked && <CopyButton text={template} label="Copy prompt" />}
            </div>
            {prompt.variables.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                Variables: {prompt.variables.map((v) => `{${v}}`).join(", ")}
              </p>
            )}
            <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-background p-4">
              {unlocked ? (
                <pre className="font-mono text-sm whitespace-pre-wrap">{template}</pre>
              ) : (
                <>
                  {/* Placeholder text only: the real template is never sent to the browser. */}
                  <pre className="font-mono text-sm whitespace-pre-wrap select-none blur-sm" aria-hidden>
                    {"xxxxx xxx xx x xxxxxxxx xxxxxxxxxx. Xxxxx x xxxx xxxxx {xxxxx} xxx {xxxxxxxx} xx x {xxxx} xxxx. Xxxxx xxxx x xxx-xxxx xxxx xxxxx 12 xxxxx. Xxx xxxxx xxxxxxxxxx, xxx xxxxxxxx xxxxx xxxx, xxx xxx xxxx x xxxxxxxx."}
                  </pre>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
                    <Lock size={22} />
                    <span className="text-sm font-medium">
                      {isFree ? "Log in to unlock this free prompt" : "Buy to unlock the full prompt"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {prompt.status === "live" && !unlocked && (
            <TryRunner
              promptId={prompt.id}
              slug={prompt.slug}
              model={prompt.model}
              variables={prompt.variables}
              defaults={examples[0]?.input ?? {}}
              runsLeft={runsLeft}
              signedIn={!!user}
            />
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Example outputs</h2>
              <div className="space-y-4">
                {examples.map((ex, i) => (
                  <Card key={i} className="p-5">
                    {Object.keys(ex.input).length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {Object.entries(ex.input).map(([k, v]) => (
                          <span key={k} className="rounded-md bg-surface-2 px-2 py-1 text-xs">
                            <span className="text-muted">{k}:</span> {v}
                          </span>
                        ))}
                      </div>
                    )}
                    <pre className="font-sans text-sm whitespace-pre-wrap text-foreground/90">{ex.output}</pre>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Reviews</h2>
              {prompt.reviewCount > 0 && (
                <>
                  <Stars value={prompt.rating} />
                  <span className="text-sm text-muted">
                    {prompt.rating.toFixed(1)} · {prompt.reviewCount} reviews
                  </span>
                </>
              )}
            </div>
            {purchased && !isOwner && (
              <ReviewForm promptId={prompt.id} slug={prompt.slug} existing={myReview} />
            )}
            {reviews.length ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <Avatar name={r.author.name} hue={r.author.avatarHue} size={28} />
                        {r.author.name}
                        <Badge tone="success">Verified buyer</Badge>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{formatDate(r.date)}</span>
                    </div>
                    <div className="mt-3"><Stars value={r.rating} size={14} /></div>
                    {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No reviews yet. Only verified buyers can review.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <div className="text-3xl font-bold">{formatPrice(prompt.priceCents)}</div>
            <p className="mt-1 text-sm text-muted">One-time purchase · Lifetime access</p>
            <div className="mt-5 flex flex-col gap-2">
              {isOwner ? (
                <Link href="/sell" className={buttonClass("secondary", "lg")}>This is your listing</Link>
              ) : purchased ? (
                <Link href="/library" className={buttonClass("primary", "lg")}>Open in library</Link>
              ) : prompt.status !== "live" ? null : isFree ? (
                user ? (
                  <GetFreeButton promptId={prompt.id} slug={prompt.slug} />
                ) : (
                  <Link href={`/login?next=/p/${prompt.slug}`} className={buttonClass("primary", "lg")}>
                    Log in to get it free
                  </Link>
                )
              ) : (
                <Link href={`/checkout/${prompt.slug}`} className={buttonClass("primary", "lg")}>
                  <ShoppingBag size={18} /> Buy now
                </Link>
              )}
              {!isOwner && (
                <div className="flex gap-2 [&>button]:flex-1">
                  <FavoriteButton promptId={prompt.id} initial={isFavorite} withLabel />
                </div>
              )}
            </div>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex gap-2"><ShieldCheck size={16} className="shrink-0 text-success" /> Reviewed by the GoPrompts team</li>
              <li className="flex gap-2"><RotateCcw size={16} className="shrink-0 text-success" /> 7-day refund if it doesn&apos;t work as described</li>
              <li className="flex gap-2"><Lock size={16} className="shrink-0 text-success" /> Secure checkout</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Link href={`/creator/${creator.handle}`} className="flex items-center gap-3">
              <Avatar name={creator.name} hue={creator.avatarHue} size={44} />
              <div>
                <div className="flex items-center gap-1 font-medium">
                  {creator.name}
                  {creator.verified && <BadgeCheck size={16} className="text-accent" />}
                </div>
                <div className="text-sm text-muted">@{creator.handle}</div>
              </div>
            </Link>
            <Link href={`/creator/${creator.handle}`} className={buttonClass("secondary", "md", "mt-5 w-full")}>
              View profile
            </Link>
          </Card>

          {user && !isOwner && <ReportButton promptId={prompt.id} />}
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">More from @{creator.handle}</h2>
          <PromptGrid prompts={more} favoriteIds={favoriteIds} />
        </section>
      )}
    </div>
  );
}
