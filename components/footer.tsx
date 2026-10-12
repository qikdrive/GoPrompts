import Link from "next/link";
import { Logo } from "./navbar";
import { categories } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">
            The marketplace for tested, high-quality AI prompts. Buy, try and sell.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Categories</h4>
          <ul className="space-y-2 text-sm text-muted">
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link href={`/browse?category=${c.slug}`} className="hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Creators</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/sell/new" className="hover:text-foreground">Sell a prompt</Link></li>
            <li><Link href="/sell" className="hover:text-foreground">Creator dashboard</Link></li>
            <li><Link href="/creator/promptsmith" className="hover:text-foreground">Top creators</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="#" className="hover:text-foreground">Terms of service</Link></li>
            <li><Link href="#" className="hover:text-foreground">Privacy policy</Link></li>
            <li><Link href="#" className="hover:text-foreground">Refund policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} GoPrompts. All rights reserved.
      </div>
    </footer>
  );
}
