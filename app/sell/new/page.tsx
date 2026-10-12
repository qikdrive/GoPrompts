import type { Metadata } from "next";
import { ListingEditor } from "@/components/listing-editor";

export const metadata: Metadata = { title: "New listing" };

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Create a listing</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Listings are reviewed before they go live. You keep 80% of every sale.
      </p>
      <ListingEditor />
    </div>
  );
}
