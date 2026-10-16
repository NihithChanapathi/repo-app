import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Thread from "./Thread";

export const metadata: Metadata = { title: "Chat" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  const { data: convo } = await supabase
    .from("conversations")
    .select("id, listing_id, listing:listings(title)")
    .eq("id", id)
    .maybeSingle();
  if (!convo) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const listing = convo.listing as unknown as { title: string } | null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/messages" className="text-sm text-neutral-500">
        ← All messages
      </Link>
      <h1 className="mt-1 truncate text-xl font-bold">{listing?.title ?? "Conversation"}</h1>
      <Link href={`/listings/${convo.listing_id}`} className="text-sm text-neutral-500 underline">
        View listing
      </Link>
      <Thread conversationId={id} userId={user.id} initial={messages ?? []} />
    </div>
  );
}
