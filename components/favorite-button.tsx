"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleFavoriteAction } from "@/app/actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  promptId,
  initial = false,
  withLabel = false,
}: {
  promptId: string;
  initial?: boolean;
  withLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        const next = !saved;
        setSaved(next); // optimistic
        startTransition(async () => {
          const res = await toggleFavoriteAction(promptId, next);
          if (res.error) {
            setSaved(!next);
            if (res.error === "auth") router.push(`/login?next=${encodeURIComponent(pathname)}`);
          }
        });
      }}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border backdrop-blur transition",
        withLabel ? "h-10 px-4 text-sm" : "h-9 w-9 justify-center",
        saved
          ? "border-danger/40 bg-danger/20 text-danger"
          : withLabel
            ? "border-border bg-surface-2 text-foreground hover:border-primary/60"
            : "border-white/15 bg-black/40 text-white hover:bg-black/60", // sits on a cover image
      )}
    >
      <Heart size={16} className={saved ? "fill-danger" : ""} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
