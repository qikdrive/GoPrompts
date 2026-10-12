import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-32 text-center">
      <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-7xl font-bold text-transparent">404</div>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">This prompt or page doesn&apos;t exist, or it was removed.</p>
      <Link href="/browse" className={buttonClass("primary", "md", "mt-6")}>Browse prompts</Link>
    </div>
  );
}
