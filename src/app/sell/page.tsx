import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SellForm from "./SellForm";

export const metadata: Metadata = { title: "Post a listing" };

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/sell");
  const { data: profile } = await supabase
    .from("profiles")
    .select("campus_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Post a listing</h1>
      <SellForm userId={user.id} campusId={profile.campus_id} />
    </div>
  );
}
