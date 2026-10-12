import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, DollarSign, Eye, Plus, ShoppingBag, Star, Wallet } from "lucide-react";
import { getCreatorDashboard } from "@/lib/queries";
import { formatCompact, formatMoney, formatPrice } from "@/lib/utils";
import { Badge, buttonClass, Card } from "@/components/ui";
import { PromptCover } from "@/components/prompt-cover";
import type { PromptStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Creator dashboard" };

const statusTone: Record<PromptStatus, "success" | "warning" | "danger" | "default"> = {
  live: "success",
  pending: "warning",
  rejected: "danger",
  draft: "default",
};

type SearchParams = Promise<{ created?: string }>;

export default async function SellDashboard({ searchParams }: { searchParams: SearchParams }) {
  const [dashboard, { created }] = await Promise.all([getCreatorDashboard(), searchParams]);
  if (!dashboard) redirect("/login?next=/sell");
  const { user, prompts, netCents, monthly } = dashboard;

  const sales = prompts.reduce((s, p) => s + p.sales, 0);
  const views = prompts.reduce((s, p) => s + p.views, 0);
  const rated = prompts.filter((p) => p.reviewCount > 0);
  const avgRating = rated.length ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
  const max = Math.max(1, ...monthly.map((m) => m.cents));

  const stats = [
    { label: "Net earnings", value: formatMoney(netCents), icon: DollarSign },
    { label: "Total sales", value: formatCompact(sales), icon: ShoppingBag },
    { label: "Listing views", value: formatCompact(views), icon: Eye },
    { label: "Avg. rating", value: avgRating ? avgRating.toFixed(1) : "—", icon: Star },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {created && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
          <CheckCircle2 size={18} className="text-success" />
          {created === "draft"
            ? "Draft saved."
            : "Listing submitted. Our team usually reviews new listings within 24 hours."}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creator dashboard</h1>
          <p className="text-sm text-muted">Welcome back, @{user.profile.handle}</p>
        </div>
        <Link href="/sell/new" className={buttonClass("primary")}>
          <Plus size={16} /> New listing
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between text-sm text-muted">
              {s.label}
              <s.icon size={16} />
            </div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="font-semibold">Earnings</h2>
          <p className="text-sm text-muted">Last 6 months, after the platform fee</p>
          <div className="mt-6 flex h-52 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.key} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted opacity-0 transition group-hover:opacity-100">
                  {formatMoney(m.cents)}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/70 transition group-hover:bg-primary"
                  style={{ height: `${Math.max(2, (m.cents / max) * 160)}px` }}
                />
                <span className="text-xs text-muted">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Wallet size={18} /> Payouts</h2>
          <div className="mt-4 text-3xl font-bold">{formatMoney(netCents)}</div>
          <p className="text-sm text-muted">Earned to date</p>
          <p className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted">
            Payouts to your bank account will be available once Stripe Connect is set up.
          </p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="font-semibold">Your listings</h2>
        </div>
        {prompts.length === 0 ? (
          <div className="border-t border-border px-6 py-12 text-center text-sm text-muted">
            You haven&apos;t listed anything yet.{" "}
            <Link href="/sell/new" className="text-primary hover:underline">Create your first listing</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-y border-border bg-surface-2 text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Prompt</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prompts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2/50">
                    <td className="px-6 py-3">
                      <Link href={`/p/${p.slug}`} className="flex items-center gap-3 hover:text-primary">
                        <PromptCover hue={p.coverHue} model={p.model} title="" className="h-9 w-12 shrink-0 rounded-md" />
                        <span className="font-medium">{p.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                      {p.rejectionReason && <div className="mt-1 max-w-48 text-xs text-muted">{p.rejectionReason}</div>}
                    </td>
                    <td className="px-4 py-3">{formatPrice(p.priceCents)}</td>
                    <td className="px-4 py-3">{formatCompact(p.sales)}</td>
                    <td className="px-4 py-3">{formatCompact(p.views)}</td>
                    <td className="px-4 py-3">{p.reviewCount ? p.rating.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
