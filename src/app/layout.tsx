import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import Header from "@/components/Header";

// Everything depends on the signed-in student, so always render on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — student marketplace`, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-neutral-500">
          {APP_NAME} is run by students, for students. Meet in public campus spots and never pay
          for tickets or passes before verifying the transfer.
        </footer>
      </body>
    </html>
  );
}
