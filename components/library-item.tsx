"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { Prompt, PromptExample } from "@/lib/types";
import { cn, fillTemplate } from "@/lib/utils";
import { PromptCover } from "./prompt-cover";
import { CopyButton } from "./copy-button";
import { Badge, Label } from "./ui";

/** A purchased prompt with a variable form that fills the template live. */
export function LibraryItem({
  prompt,
  template,
  examples,
}: {
  prompt: Prompt;
  template: string;
  examples: PromptExample[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const filled = fillTemplate(template, values);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left">
        <PromptCover hue={prompt.coverHue} model={prompt.model} title="" className="h-14 w-20 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{prompt.title}</div>
          <div className="mt-1 flex gap-2">
            <Badge>{prompt.model}</Badge>
            <span className="text-xs text-muted">by @{prompt.creator.handle}</span>
          </div>
        </div>
        <ChevronDown size={20} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-6 border-t border-border p-5 md:grid-cols-2">
          <div className="space-y-3">
            {prompt.variables.map((v) => (
              <div key={v}>
                <Label htmlFor={`${prompt.id}-${v}`}>{v.replace(/_/g, " ")}</Label>
                <input
                  id={`${prompt.id}-${v}`}
                  className="input"
                  placeholder={examples[0]?.input[v]}
                  value={values[v] ?? ""}
                  onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                />
              </div>
            ))}
            <Link href={`/p/${prompt.slug}`} className="inline-flex items-center gap-1 pt-1 text-sm text-primary hover:underline">
              View listing &amp; review <ExternalLink size={14} />
            </Link>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium">Ready-to-use prompt</span>
              <CopyButton text={filled} />
            </div>
            <pre className="rounded-xl border border-border bg-background p-4 font-mono text-sm whitespace-pre-wrap">
              {filled}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
