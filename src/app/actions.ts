"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function startConversation(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.seller_id === user.id) redirect("/");

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (existing) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.seller_id })
    .select("id")
    .single();
  if (error || !created) redirect(`/listings/${listingId}?error=chat`);
  redirect(`/messages/${created.id}`);
}

export async function setListingStatus(listingId: string, status: "sold" | "removed" | "active") {
  const supabase = await createClient();
  await supabase.from("listings").update({ status }).eq("id", listingId);
  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
  redirect(status === "active" ? `/listings/${listingId}` : "/");
}

export async function reportListing(listingId: string, formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) redirect(`/listings/${listingId}?error=reason`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase
    .from("reports")
    .insert({ reporter_id: user.id, listing_id: listingId, reason: reason.slice(0, 500) });
  redirect(`/listings/${listingId}?reported=1`);
}
