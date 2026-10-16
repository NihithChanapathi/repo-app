import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function Header() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <nav className="ml-auto flex items-center gap-3 text-sm">
          {signedIn ? (
            <>
              <Link href="/messages" className="text-neutral-600 hover:text-neutral-900">
                Messages
              </Link>
              <Link
                href="/sell"
                className="rounded-full bg-neutral-900 px-4 py-1.5 font-medium text-white hover:bg-neutral-700"
              >
                Sell
              </Link>
              <form action={signOut}>
                <button className="text-neutral-500 hover:text-neutral-900">Sign out</button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-neutral-900 px-4 py-1.5 font-medium text-white hover:bg-neutral-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
