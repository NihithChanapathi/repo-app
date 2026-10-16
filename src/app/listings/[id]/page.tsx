/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { categoryLabel } from "@/config/app";
import { formatDate, formatPrice, timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { reportListing, setListingStatus, startConversation } from "@/app/actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reported?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Listing" };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { reported, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${id}`);

  const { data: l } = await supabase
    .from("listings")
    .select("*, seller:profiles(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!l) notFound();

  const isOwner = l.seller_id === user.id;
  const details: [string, string | null][] = [
    ["Category", categoryLabel(l.category)],
    ["Condition", l.condition],
    ["Pickup / area", l.location],
    ["Event date", l.event_date ? formatDate(l.event_date) : null],
    [
      "Lease",
      l.lease_start && l.lease_end ? `${formatDate(l.lease_start)} – ${formatDate(l.lease_end)}` : null,
    ],
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        {l.images.length === 0 && (
          <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
            No photo
          </div>
        )}
        {l.images.map((src: string) => (
          <img key={src} src={src} alt={l.title} className="w-full rounded-xl object-cover" />
        ))}
      </div>

      <div className="space-y-4">
        <div>
          {l.status !== "active" && (
            <span className="mb-2 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium uppercase">
              {l.status}
            </span>
          )}
          <h1 className="text-2xl font-bold">{l.title}</h1>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(l.price_cents)}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Posted {timeAgo(l.created_at)} by {l.seller?.display_name ?? "a student"}
          </p>
        </div>

        <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white text-sm">
          {details
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2">
                <dt className="text-neutral-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>

        {l.description && <p className="whitespace-pre-wrap text-sm">{l.description}</p>}

        {error === "chat" && <p className="text-sm text-red-600">Couldn&apos;t start the chat. Try again.</p>}

        {isOwner ? (
          <div className="flex gap-2">
            {l.status === "active" ? (
              <form action={setListingStatus.bind(null, l.id, "sold")}>
                <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  Mark as sold
                </button>
              </form>
            ) : (
              <form action={setListingStatus.bind(null, l.id, "active")}>
                <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  Relist
                </button>
              </form>
            )}
            <form action={setListingStatus.bind(null, l.id, "removed")}>
              <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">Delete</button>
            </form>
          </div>
        ) : (
          l.status === "active" && (
            <form action={startConversation.bind(null, l.id)}>
              <button className="w-full rounded-lg bg-neutral-900 py-2.5 font-medium text-white">
                Message seller
              </button>
            </form>
          )
        )}

        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Safety: meet in a public campus spot, keep the conversation in the app, and for tickets,
          parking passes or subleases, confirm the official transfer before you pay.
        </div>

        {!isOwner && (
          <details className="text-sm">
            <summary className="cursor-pointer text-neutral-500">Report this listing</summary>
            {reported ? (
              <p className="mt-2 text-green-700">Thanks, we&apos;ll take a look.</p>
            ) : (
              <form action={reportListing.bind(null, l.id)} className="mt-2 flex gap-2">
                <input
                  name="reason"
                  required
                  placeholder="What's wrong?"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5"
                />
                <button className="rounded-lg border border-neutral-300 px-3 py-1.5">Send</button>
              </form>
            )}
          </details>
        )}
      </div>
    </div>
  );
}
