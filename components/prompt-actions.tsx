"use client";

import { useActionState, useState, useTransition } from "react";
import { Flag, Loader2, Plus, Star } from "lucide-react";
import { acquirePromptAction, reportPromptAction, submitReviewAction } from "@/app/actions";
import { Button, Label } from "./ui";
import { cn } from "@/lib/utils";

/** "Get for free" for free prompts: adds a $0 purchase so it shows up in the library. */
export function GetFreeButton({ promptId, slug }: { promptId: string; slug: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await acquirePromptAction(promptId, slug);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add to library — free
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </>
  );
}

export function ReviewForm({
  promptId,
  slug,
  existing,
}: {
  promptId: string;
  slug: string;
  existing?: { rating: number; comment: string };
}) {
  const [state, action, pending] = useActionState(submitReviewAction, undefined);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <input type="hidden" name="promptId" value={promptId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <div className="text-sm font-medium">{existing ? "Update your review" : "Rate this prompt"}</div>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
          >
            <Star size={22} className={cn((hover || rating) >= i ? "fill-warning text-warning" : "text-border")} />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        maxLength={1000}
        defaultValue={existing?.comment}
        className="input"
        placeholder="What did you use it for? How were the results?"
        aria-label="Review comment"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || rating === 0}>
          {pending && <Loader2 size={14} className="animate-spin" />} {existing ? "Update review" : "Post review"}
        </Button>
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
        {state?.message && <span className="text-sm text-success">{state.message}</span>}
      </div>
    </form>
  );
}

export function ReportButton({ promptId }: { promptId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportPromptAction, undefined);

  if (state?.message) return <p className="px-2 text-xs text-success">{state.message}</p>;

  return open ? (
    <form action={action} className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="promptId" value={promptId} />
      <Label htmlFor="reason">What&apos;s wrong with this listing?</Label>
      <textarea id="reason" name="reason" rows={2} required className="input" />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="danger" disabled={pending}>Send report</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  ) : (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-2 text-xs text-muted hover:text-danger">
      <Flag size={12} /> Report this listing
    </button>
  );
}
