"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, LayoutDashboard, Library, LogOut, Menu, Plus, Search, Shield, Sparkles, Store, User, X } from "lucide-react";
import { buttonClass } from "./ui";
import { Avatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { signOutAction } from "@/app/actions";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/browse", label: "Browse", icon: Store },
  { href: "/images", label: "Images", icon: ImageIcon },
  { href: "/library", label: "Library", icon: Library },
  { href: "/sell", label: "Sell", icon: Plus },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
        <Sparkles size={16} className="text-white" />
      </span>
      GoPrompts
    </Link>
  );
}

function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/browse${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      }}
    >
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search prompts..."
        className="input h-10 pl-9"
        aria-label="Search prompts"
      />
    </form>
  );
}

function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-surface-2";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open} className="flex rounded-full">
        <Avatar name={profile.name} hue={profile.avatarHue} size={32} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium">{profile.name}</div>
            <div className="truncate text-xs text-muted">@{profile.handle}</div>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link href={`/creator/${profile.handle}`} className={item}><User size={16} className="text-muted" /> Profile</Link>
          <Link href="/library" className={item}><Library size={16} className="text-muted" /> Library</Link>
          <Link href="/sell" className={item}><LayoutDashboard size={16} className="text-muted" /> Creator dashboard</Link>
          {profile.role === "admin" && (
            <Link href="/admin" className={item}><Shield size={16} className="text-muted" /> Admin</Link>
          )}
          <div className="my-1 h-px bg-border" />
          <form action={signOutAction}>
            <button className={cn(item, "w-full text-danger")}><LogOut size={16} /> Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function Navbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(l.href) ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <SearchBox className="ml-auto hidden w-full max-w-xs lg:block" />
        <div className="ml-auto hidden items-center gap-2 md:flex lg:ml-0">
          <ThemeToggle />
          {!profile && (
            <Link href="/login" className={buttonClass("ghost", "sm")}>
              Log in
            </Link>
          )}
          <Link href="/sell/new" className={buttonClass("primary", "sm")}>
            <Plus size={16} /> Sell a prompt
          </Link>
          {profile && <UserMenu profile={profile} />}
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-muted hover:text-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <SearchBox className="mb-3" />
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
              >
                <l.icon size={18} className="text-muted" />
                {l.label}
              </Link>
            ))}
            {profile?.role === "admin" && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2">
                <Shield size={18} className="text-muted" /> Admin
              </Link>
            )}
            {profile ? (
              <form action={signOutAction}>
                <button className={buttonClass("secondary", "md", "mt-2 w-full")}>Sign out (@{profile.handle})</button>
              </form>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("secondary", "md", "mt-2")}>
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
