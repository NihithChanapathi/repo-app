/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

type Row = {
  id: string;
  buyer_id: string;
  created_at: string;
  listing: { title: string; images: string[] } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, created_at, listing:listings(title, images), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Messages</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">
          No conversations yet. Open a listing and tap “Message seller”.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {rows.map((c) => {
            const other = c.buyer_id === user.id ? c.seller : c.buyer;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {c.listing?.images?.[0] && (
                      <img src={c.listing.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.listing?.title ?? "Listing unavailable"}</div>
                    <div className="text-xs text-neutral-500">
                      {other?.display_name ?? "Student"} · {timeAgo(c.created_at)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
