"use client";

import { useState } from "react";
import { campusForEmail } from "@/config/app";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!campusForEmail(email)) {
      setError("Please use your @ncsu.edu, @unc.edu or @duke.edu email.");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
        Check <strong>{email}</strong> for your sign-in link. Open it in this same browser.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@ncsu.edu"
        autoComplete="email"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={status === "sending"}
        className="w-full rounded-lg bg-neutral-900 py-2 font-medium text-white disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
