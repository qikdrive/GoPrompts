import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, getPromptPage } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui";
import { PromptCover } from "@/components/prompt-cover";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/checkout/${slug}`);

  const page = await getPromptPage(slug);
  if (!page || page.prompt.status !== "live") notFound();
  const { prompt } = page;
  // Already owned, own listing, or free → nothing to pay for.
  if (page.purchased || page.isOwner || prompt.priceCents === 0) redirect(`/p/${slug}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href={`/p/${prompt.slug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back to prompt
      </Link>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Checkout</h1>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <CheckoutForm
            promptId={prompt.id}
            slug={prompt.slug}
            priceCents={prompt.priceCents}
            title={prompt.title}
            email={user.email}
          />
        </Card>
        <Card className="h-fit overflow-hidden">
          <PromptCover hue={prompt.coverHue} model={prompt.model} title={prompt.title} className="aspect-[16/9]" />
          <div className="space-y-3 p-5 text-sm">
            <div className="font-medium">{prompt.title}</div>
            <div className="text-muted">by @{prompt.creator.handle} · {prompt.model}</div>
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span>{formatPrice(prompt.priceCents)}</div>
              <div className="flex justify-between"><span className="text-muted">Tax</span>$0.00</div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>{formatPrice(prompt.priceCents)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
