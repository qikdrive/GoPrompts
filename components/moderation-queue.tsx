"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, X } from "lucide-react";
import { moderatePromptAction, resolveReportAction } from "@/app/actions";
import type { ModerationItem } from "@/lib/queries";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Badge, Button } from "./ui";

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.prompt.id ?? null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function decide(id: string, decision: "live" | "rejected") {
    setError("");
    startTransition(async () => {
      const res = await moderatePromptAction(id, decision, reason[id]);
      if (res.error) setError(res.error);
    });
  }

  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted">Queue is empty. 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.map(({ prompt: p, template, examples }) => {
        const expanded = open === p.id;
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <button onClick={() => setOpen(expanded ? null : p.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="text-sm text-muted">
                  @{p.creator.handle} · {p.model} · {formatPrice(p.priceCents)} · {formatDate(p.createdAt)}
                </div>
              </div>
              <Badge tone="warning">pending</Badge>
              <ChevronDown size={18} className={cn("text-muted transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="space-y-4 border-t border-border p-5 text-sm">
                <p className="text-foreground/90">{p.description}</p>
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted uppercase">Prompt template</div>
                  <pre className="rounded-lg border border-border bg-background p-3 font-mono whitespace-pre-wrap">{template}</pre>
                </div>
                {examples.map((ex, i) => (
                  <div key={i}>
                    <div className="mb-1 text-xs font-semibold text-muted uppercase">Example output {i + 1}</div>
                    <pre className="rounded-lg border border-border bg-background p-3 font-sans whitespace-pre-wrap">{ex.output}</pre>
                  </div>
                ))}
                <input
                  className="input"
                  placeholder="Rejection reason (shown to the creator)"
                  value={reason[p.id] ?? ""}
                  onChange={(e) => setReason({ ...reason, [p.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={pending} onClick={() => decide(p.id, "live")}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" disabled={pending} onClick={() => decide(p.id, "rejected")}>
                    <X size={14} /> Reject
                  </Button>
                  <Link href={`/p/${p.slug}`} className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                    Preview <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-3 flex gap-2">
      <Button size="sm" variant="secondary" disabled={pending}
        onClick={() => startTransition(async () => void (await resolveReportAction(reportId, "resolved")))}>
        Resolve
      </Button>
      <Button size="sm" variant="ghost" disabled={pending}
        onClick={() => startTransition(async () => void (await resolveReportAction(reportId, "dismissed")))}>
        Dismiss
      </Button>
    </div>
  );
}
