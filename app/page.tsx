import Link from "next/link";
import { ArrowRight, BadgeCheck, FlaskConical, ShieldCheck, Wallet } from "lucide-react";
import { categories } from "@/lib/constants";
import { countLivePrompts, getFavoriteIds, getListings, getTopCreators } from "@/lib/queries";
import { PromptGrid } from "@/components/prompt-card";
import { buttonClass, SectionHeading } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";
import { Avatar } from "@/components/avatar";
import { Rating } from "@/components/rating";
import { formatCompact } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, trending, newest, creators, total, favoriteIds] = await Promise.all([
    getListings({ featured: true, limit: 4 }),
    getListings({ sort: "trending", limit: 8 }),
    getListings({ sort: "newest", limit: 4 }),
    getTopCreators(5),
    countLivePrompts(),
    getFavoriteIds(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> {total} reviewed prompts
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Prompts that{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              actually work
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Buy expert-crafted prompts for ChatGPT, Claude, Midjourney and more. Try them before you buy,
            or sell your own and get paid.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/browse" className={buttonClass("primary", "lg")}>
              Explore prompts <ArrowRight size={18} />
            </Link>
            <Link href="/sell/new" className={buttonClass("secondary", "lg")}>
              Start selling
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2 text-sm">
            {["ChatGPT", "Claude", "Midjourney", "Stable Diffusion", "Sora"].map((m) => (
              <Link
                key={m}
                href={`/browse?model=${encodeURIComponent(m)}`}
                className="rounded-full border border-border px-3 py-1 text-muted hover:border-primary/60 hover:text-foreground"
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-16 sm:px-6">
        {/* Categories */}
        <section>
          <SectionHeading title="Browse by category" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/browse?category=${c.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <CategoryIcon name={c.icon} size={20} />
                </span>
                <span className="font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section>
          <SectionHeading
            title="Featured prompts"
            subtitle="Hand-picked by our team this week"
            action={
              <Link href="/browse" className="text-sm text-primary hover:underline">
                View all
              </Link>
            }
          />
          <PromptGrid prompts={featured} favoriteIds={favoriteIds} />
        </section>

        {/* How it works */}
        <section className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: FlaskConical,
              title: "Try before you buy",
              text: "Run any prompt on your own inputs and see real output. The prompt itself stays hidden until you buy.",
            },
            {
              icon: ShieldCheck,
              title: "Reviewed for quality",
              text: "Every listing is reviewed and needs real example outputs. Not happy? Get a refund within 7 days.",
            },
            {
              icon: Wallet,
              title: "Earn as a creator",
              text: "List prompts in minutes and keep 80% of every sale, paid out straight to your bank account.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-6">
              <f.icon className="text-accent" size={24} />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </section>

        {/* Trending */}
        <section>
          <SectionHeading title="Trending now" subtitle="Most viewed this week" />
          <PromptGrid prompts={trending} favoriteIds={favoriteIds} />
        </section>

        {/* Top creators */}
        <section>
          <SectionHeading title="Top creators" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {creators.map((c) => (
              <Link
                key={c.handle}
                href={`/creator/${c.handle}`}
                className="flex flex-col items-center rounded-2xl border border-border bg-surface p-5 text-center transition hover:border-primary/50"
              >
                <Avatar name={c.name} hue={c.avatarHue} size={56} />
                <span className="mt-3 flex items-center gap-1 font-medium">
                  {c.name}
                  {c.verified && <BadgeCheck size={16} className="text-accent" />}
                </span>
                <span className="text-sm text-muted">@{c.handle}</span>
                <span className="mt-3 flex items-center gap-3 text-sm">
                  <Rating value={c.rating} count={c.rating ? undefined : 0} />
                  <span className="text-muted">{formatCompact(c.sales)} sales</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* New */}
        <section>
          <SectionHeading title="Just added" />
          <PromptGrid prompts={newest} favoriteIds={favoriteIds} />
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(34,211,238,0.18),transparent_60%)]" />
          <h2 className="relative text-3xl font-bold tracking-tight">Turn your prompts into income</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-muted">
            Join thousands of creators selling on GoPrompts. Free to list, 80% revenue share.
          </p>
          <Link href="/sell/new" className={buttonClass("primary", "lg", "relative mt-6")}>
            Create your first listing <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}
