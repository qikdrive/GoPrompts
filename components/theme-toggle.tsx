"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY as STORAGE_KEY, type Theme } from "@/lib/theme";

const order: Theme[] = ["system", "light", "dark"];
const icons = { system: Monitor, light: Sun, dark: Moon };
const labels = { system: "System theme", light: "Light theme", dark: "Dark theme" };

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = document.documentElement.dataset.theme;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const Icon = icons[theme];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        applyTheme(next);
      }}
      title={`${labels[theme]} (click for ${labels[next].toLowerCase()})`}
      aria-label={`${labels[theme]}. Switch to ${labels[next].toLowerCase()}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Icon size={18} />
    </button>
  );
}
