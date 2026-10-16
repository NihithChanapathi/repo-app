import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-600">
        We&apos;ll email you a link. Use your school address (NC State, UNC or Duke).
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          That link expired or was opened in a different browser. Request a new one.
        </p>
      )}
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
