"use client";

import { useActionState, useState } from "react";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { createListingAction } from "@/app/actions";
import { categories, models, PLATFORM_FEE } from "@/lib/constants";
import type { AIModel } from "@/lib/types";
import { extractVariables, formatMoney, formatPrice } from "@/lib/utils";
import { Badge, Button, Card, Label } from "./ui";
import { PromptCover } from "./prompt-cover";

export function ListingEditor() {
  const [state, action, pending] = useActionState(createListingAction, undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0].slug);
  const [tags, setTags] = useState("");
  const [model, setModel] = useState<AIModel>("ChatGPT");
  const [price, setPrice] = useState("4.99");
  const [template, setTemplate] = useState("");
  const [examples, setExamples] = useState([""]);

  const variables = extractVariables(template);
  const priceCents = Math.round((parseFloat(price) || 0) * 100);
  const hue = (title.length * 23 + 260) % 360;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">1. Basics</h2>
          <div>
            <Label htmlFor="title">Title</Label>
            <input id="title" name="title" required minLength={3} maxLength={80} className="input"
              placeholder="e.g. Viral LinkedIn Post Generator"
              value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <textarea id="desc" name="description" required minLength={10} rows={3} maxLength={500} className="input"
              placeholder="What does it do, and why is it good?"
              value={description} onChange={(e) => setDescription(e.target.value)} />
            <p className="mt-1 text-right text-xs text-muted">{description.length}/500</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="model">AI model</Label>
              <select id="model" name="model" className="input" value={model} onChange={(e) => setModel(e.target.value as AIModel)}>
                {models.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <input id="tags" name="tags" className="input" placeholder="comma separated, e.g. seo, blog, content"
              value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">2. Prompt</h2>
          <div className="flex gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
            <Info size={16} className="mt-0.5 shrink-0" />
            Wrap the parts buyers should fill in with curly braces, like {"{topic}"}. Only buyers see the prompt text.
          </div>
          <textarea name="template" required minLength={10} rows={8} className="input font-mono" aria-label="Prompt template"
            placeholder="You are an expert copywriter. Write a {format} about {topic} for {audience}..."
            value={template} onChange={(e) => setTemplate(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Detected variables:</span>
            {variables.length ? variables.map((v) => <Badge key={v} tone="primary">{v}</Badge>) : <span className="text-muted">none yet</span>}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">3. Example outputs</h2>
            <Button type="button" variant="ghost" size="sm" disabled={examples.length >= 5}
              onClick={() => setExamples([...examples, ""])}>
              <Plus size={14} /> Add example
            </Button>
          </div>
          <p className="text-sm text-muted">Paste real outputs. Listings with good examples sell up to 3× more.</p>
          {examples.map((ex, i) => (
            <div key={i} className="relative">
              <textarea name="example" rows={4} maxLength={5000} className="input" placeholder={`Example output ${i + 1}`}
                value={ex}
                onChange={(e) => setExamples(examples.map((x, j) => (j === i ? e.target.value : x)))} />
              {examples.length > 1 && (
                <button type="button" aria-label="Remove example"
                  className="absolute top-2 right-2 rounded p-1 text-muted hover:text-danger"
                  onClick={() => setExamples(examples.filter((_, j) => j !== i))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">4. Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <input id="price" name="price" type="number" min="0" max="1000" step="0.01" className="input"
                value={price} onChange={(e) => setPrice(e.target.value)} />
              <p className="mt-1 text-xs text-muted">Set 0 to list it for free.</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Buyer pays</span>{formatPrice(priceCents)}</div>
              <div className="mt-1 flex justify-between"><span className="text-muted">Platform fee ({PLATFORM_FEE * 100}%)</span>-{formatMoney(Math.round(priceCents * PLATFORM_FEE))}</div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>You earn</span><span className="text-success">{formatMoney(Math.round(priceCents * (1 - PLATFORM_FEE)))}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live preview */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <h3 className="text-sm font-semibold text-muted">Preview</h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <PromptCover hue={hue} model={model} title={title || "Your prompt title"} className="aspect-[16/10]" />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Badge>{model}</Badge>
              <span className="text-sm font-semibold">{formatPrice(priceCents)}</span>
            </div>
            <div className="font-semibold">{title || "Your prompt title"}</div>
            <p className="line-clamp-2 text-sm text-muted">{description || "Your description will appear here."}</p>
          </div>
        </div>
        {state?.error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{state.error}</p>
        )}
        <Button type="submit" name="intent" value="pending" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 size={16} className="animate-spin" />} Submit for review
        </Button>
        <Button type="submit" name="intent" value="draft" variant="secondary" className="w-full" disabled={pending}>
          Save draft
        </Button>
      </aside>
    </form>
  );
}
