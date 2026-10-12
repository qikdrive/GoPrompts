import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Flag, ShieldCheck, Users } from "lucide-react";
import { getAdminStats, getCurrentUser, getModerationQueue, getOpenReports } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui";
import { ModerationQueue, ReportActions } from "@/components/moderation-queue";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  // Data is protected by RLS regardless; this just hides the page from non-admins.
  if (user?.profile.role !== "admin") notFound();

  const [pending, reports, stats] = await Promise.all([getModerationQueue(), getOpenReports(), getAdminStats()]);

  const tiles = [
    { label: "Pending review", value: pending.length, icon: Clock },
    { label: "Open reports", value: reports.length, icon: Flag },
    { label: "Live listings", value: stats.live, icon: ShieldCheck },
    { label: "Users", value: stats.users, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Moderation</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between text-sm text-muted">{s.label}<s.icon size={16} /></div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-4 font-semibold">Review queue</h2>
          <ModerationQueue items={pending} />
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Reports</h2>
          {reports.length ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <Card key={r.id} className="p-4 text-sm">
                  {r.prompt ? (
                    <Link href={`/p/${r.prompt.slug}`} className="font-medium hover:text-primary">{r.prompt.title}</Link>
                  ) : (
                    <span className="font-medium">Deleted listing</span>
                  )}
                  <div className="mt-1 text-muted">{r.reason}</div>
                  <div className="mt-2 text-xs text-muted">@{r.reporter} · {formatDate(r.date)}</div>
                  <ReportActions reportId={r.id} />
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No open reports.</p>
          )}
        </section>
      </div>
    </div>
  );
}
