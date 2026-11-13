import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handoff — Keep the work moving",
  description: "A collaborative AI workspace with shared project memory.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
