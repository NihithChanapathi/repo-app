/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categoryLabel } from "@/config/app";
import { formatPrice, timeAgo } from "@/lib/format";

export type ListingSummary = {
  id: string;
  title: string;
  price_cents: number;
  category: string;
  images: string[];
  created_at: string;
};

export default function ListingCard({ l }: { l: ListingSummary }) {
  return (
    <Link
      href={`/listings/${l.id}`}
      className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-square bg-neutral-100">
        {l.images[0] ? (
          <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold">{formatPrice(l.price_cents)}</div>
        <div className="truncate text-sm">{l.title}</div>
        <div className="mt-1 text-xs text-neutral-500">
          {categoryLabel(l.category)} · {timeAgo(l.created_at)}
        </div>
      </div>
    </Link>
  );
}
