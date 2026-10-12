"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Loader2, Lock } from "lucide-react";
import { acquirePromptAction } from "@/app/actions";
import { Button, buttonClass, Label } from "./ui";
import { formatMoney } from "@/lib/utils";

/**
 * Demo checkout: records the purchase through the `acquire_prompt` RPC, which only
 * accepts unpaid purchases while app_settings.demo_payments is on.
 * Replace with a redirect to Stripe Checkout + webhook.
 */
export function CheckoutForm({
  promptId,
  slug,
  priceCents,
  title,
  email,
}: {
  promptId: string;
  slug: string;
  priceCents: number;
  title: string;
  email: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 size={48} className="text-success" />
        <h2 className="mt-4 text-xl font-semibold">Purchase complete</h2>
        <p className="mt-1 text-sm text-muted">&ldquo;{title}&rdquo; is now in your library.</p>
        <Link href="/library" className={buttonClass("primary", "md", "mt-6")}>
          Go to library
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        startTransition(async () => {
          const res = await acquirePromptAction(promptId, slug);
          if (res?.error) setError(res.error);
          else setDone(true);
        });
      }}
    >
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
        Demo mode: no card is charged. Stripe payments come next.
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" readOnly value={email} className="input opacity-70" />
      </div>
      <div>
        <Label htmlFor="card">Card details</Label>
        <div className="relative">
          <CreditCard size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input id="card" disabled className="input pl-9" placeholder="Handled by Stripe" />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
        {pending ? "Processing..." : `Pay ${formatMoney(priceCents)}`}
      </Button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </form>
  );
}
