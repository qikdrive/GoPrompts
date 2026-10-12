"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories, models } from "@/lib/constants";
import { cn } from "@/lib/utils";

const prices = [
  { value: "", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "under5", label: "Under $5" },
  { value: "5to10", label: "$5 – $10" },
];

export const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "top", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function useParamSetter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function BrowseFilters() {
  const params = useSearchParams();
  const set = useParamSetter();
  const category = params.get("category") ?? "";
  const model = params.get("model") ?? "";
  const price = params.get("price") ?? "";

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">Category</h3>
        <Option active={!category} onClick={() => set("category", "")}>All categories</Option>
        {categories.map((c) => (
          <Option key={c.slug} active={category === c.slug} onClick={() => set("category", c.slug)}>
            {c.name}
          </Option>
        ))}
      </div>
      <div>
        <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">Model</h3>
        <Option active={!model} onClick={() => set("model", "")}>All models</Option>
        {models.map((m) => (
          <Option key={m} active={model === m} onClick={() => set("model", m)}>
            {m}
          </Option>
        ))}
      </div>
      <div>
        <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">Price</h3>
        {prices.map((p) => (
          <Option key={p.value} active={price === p.value} onClick={() => set("price", p.value)}>
            {p.label}
          </Option>
        ))}
      </div>
    </aside>
  );
}

export function SortSelect() {
  const params = useSearchParams();
  const set = useParamSetter();
  return (
    <select
      value={params.get("sort") ?? "trending"}
      onChange={(e) => set("sort", e.target.value === "trending" ? "" : e.target.value)}
      className="input h-10 w-auto"
      aria-label="Sort by"
    >
      {sortOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
