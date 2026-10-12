import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Library } from "lucide-react";
import { getFavorites, getLibrary } from "@/lib/queries";
import { LibraryItem } from "@/components/library-item";
import { PromptGrid } from "@/components/prompt-card";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "My library" };

export default async function LibraryPage() {
  const [owned, favorites] = await Promise.all([getLibrary(), getFavorites()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Library size={24} className="text-primary" /> My library
      </h1>
      <p className="mt-1 text-sm text-muted">
        Prompts you own. Fill in the variables and copy the finished prompt.
      </p>

      <div className="mt-8 space-y-3">
        {owned.length ? (
          owned.map((entry) => <LibraryItem key={entry.prompt.id} {...entry} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">You haven&apos;t bought any prompts yet.</p>
            <Link href="/browse" className={buttonClass("primary", "md", "mt-4")}>Browse prompts</Link>
          </div>
        )}
      </div>

      <h2 className="mt-14 mb-6 flex items-center gap-2 text-xl font-semibold">
        <Heart size={20} className="text-danger" /> Saved
      </h2>
      {favorites.length ? (
        <div className="[&>div]:xl:grid-cols-3">
          <PromptGrid prompts={favorites} favoriteIds={favorites.map((p) => p.id)} />
        </div>
      ) : (
        <p className="text-sm text-muted">Tap the heart on any prompt to save it here.</p>
      )}
    </div>
  );
}
