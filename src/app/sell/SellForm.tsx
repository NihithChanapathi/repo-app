"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, MAX_PHOTOS, type CategoryId } from "@/config/app";
import { createClient } from "@/lib/supabase/client";

const input = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2";
const label = "mb-1 block text-sm font-medium";

export default function SellForm({ userId, campusId }: { userId: string; campusId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryId>("dorm");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const images: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        images.push(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
      }

      const dollars = Number(fd.get("price"));
      if (!Number.isFinite(dollars) || dollars < 0) throw new Error("Enter a valid price.");

      const str = (k: string) => (String(fd.get(k) ?? "").trim() || null);
      const { data, error: insErr } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          campus_id: campusId,
          category,
          title: String(fd.get("title")).trim(),
          description: String(fd.get("description") ?? "").trim(),
          price_cents: Math.round(dollars * 100),
          condition: str("condition"),
          location: str("location"),
          event_date: category === "tickets" || category === "parking" ? str("event_date") : null,
          lease_start: category === "sublease" ? str("lease_start") : null,
          lease_end: category === "sublease" ? str("lease_end") : null,
          images,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      router.push(`/listings/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className={label}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId)}
          className={input}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Title</label>
        <input name="title" required minLength={3} maxLength={100} className={input} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Price ($, 0 = free)</label>
          <input name="price" type="number" min="0" max="10000" step="0.01" required className={input} />
        </div>
        <div>
          <label className={label}>Condition</label>
          <input name="condition" placeholder="e.g. Like new" className={input} />
        </div>
      </div>

      {(category === "tickets" || category === "parking") && (
        <div>
          <label className={label}>Event / game date</label>
          <input name="event_date" type="date" required className={input} />
        </div>
      )}
      {category === "sublease" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Lease starts</label>
            <input name="lease_start" type="date" required className={input} />
          </div>
          <div>
            <label className={label}>Lease ends</label>
            <input name="lease_end" type="date" required className={input} />
          </div>
        </div>
      )}

      <div>
        <label className={label}>Pickup / area</label>
        <input name="location" placeholder="e.g. Centennial Campus, Wolf Village" className={input} />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea name="description" rows={4} maxLength={2000} className={input} />
      </div>

      <div>
        <label className={label}>Photos (up to {MAX_PHOTOS})</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))}
          className="text-sm"
        />
        {files.length > 0 && <p className="mt-1 text-xs text-neutral-500">{files.length} selected</p>}
      </div>

      {(category === "tickets" || category === "parking" || category === "sublease") && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          Only list tickets, passes or leases you&apos;re allowed to transfer. Check your school&apos;s
          and landlord&apos;s rules first. Buyers should confirm the transfer before paying.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-neutral-900 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post listing"}
      </button>
    </form>
  );
}
