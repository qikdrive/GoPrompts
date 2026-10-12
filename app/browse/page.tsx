import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getCategory } from "@/lib/constants";
import { getFavoriteIds, getListings } from "@/lib/queries";
import { PromptGrid } from "@/components/prompt-card";
import { BrowseFilters, SortSelect } from "@/components/browse-filters";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Browse prompts" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category, model, price, sort } = await searchParams;
  const [results, favoriteIds] = await Promise.all([
    getListings({ q, category, model, price, sort }),
    getFavoriteIds(),
  ]);

  const heading = q
    ? `Results for "${q}"`
    : category
      ? (getCategory(category)?.name ?? "Prompts")
      : model
        ? `${model} prompts`
        : "All prompts";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-56 lg:shrink-0">
          <Suspense>
            <BrowseFilters />
          </Suspense>
        </div>
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
              <p className="text-sm text-muted">{results.length} prompts</p>
            </div>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          {results.length > 0 ? (
            <div className="[&>div]:xl:grid-cols-3">
              <PromptGrid prompts={results} favoriteIds={favoriteIds} />
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <SearchX size={40} className="text-muted" />
              <h2 className="mt-4 font-semibold">No prompts found</h2>
              <p className="mt-1 text-sm text-muted">Try a different search or clear your filters.</p>
              <Link href="/browse" className={buttonClass("secondary", "md", "mt-5")}>
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
