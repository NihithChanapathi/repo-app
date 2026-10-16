import Link from "next/link";
import { APP_NAME, APP_TAGLINE, CAMPUSES, CATEGORIES } from "@/config/app";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import ListingCard, { type ListingSummary } from "@/components/ListingCard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const { category, q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Landing />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("campus_id")
    .eq("id", user.id)
    .single();
  const campus = CAMPUSES.find((c) => c.id === profile?.campus_id);

  let query = supabase
    .from("listings")
    .select("id, title, price_cents, category, images, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (category && CATEGORIES.some((c) => c.id === category)) query = query.eq("category", category);
  if (q) query = query.ilike("title", `%${q.replace(/[%,()]/g, " ").trim()}%`);
  const { data } = await query;
  const listings = (data ?? []) as ListingSummary[];

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-neutral-900 bg-neutral-900 text-white"
        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{campus?.name ?? "Your campus"} marketplace</h1>
        <form className="w-full sm:w-72">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search listings"
            className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/" className={chip(!category)}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/?category=${c.id}`} className={chip(category === c.id)}>
            {c.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm text-neutral-500">Be the first to post something.</p>
          <Link
            href="/sell"
            className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
          >
            Post a listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Landing() {
  return (
    <section className="py-12 text-center sm:py-20">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{APP_NAME}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">{APP_TAGLINE}</p>
      <p className="mt-2 text-sm text-neutral-500">
        Verified with your school email. Only students on your campus can see your listings.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-block rounded-full bg-neutral-900 px-8 py-3 font-medium text-white hover:bg-neutral-700"
      >
        Sign in with your .edu email
      </Link>
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {CAMPUSES.map((c) => (
          <span key={c.id} className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm">
            {c.name}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-neutral-500">
        {CATEGORIES.map((c) => (
          <span key={c.id}>{c.label}</span>
        ))}
      </div>
    </section>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm">
      <h1 className="text-lg font-bold">Almost there: connect Supabase</h1>
      <ol className="mt-3 list-decimal space-y-1 pl-5">
        <li>Create a free project at supabase.com.</li>
        <li>Run <code>supabase/schema.sql</code> in the SQL Editor.</li>
        <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill in the URL and anon key.</li>
        <li>Restart <code>npm run dev</code>.</li>
      </ol>
      <p className="mt-3 text-neutral-600">See README.md for the full walkthrough.</p>
    </div>
  );
}
