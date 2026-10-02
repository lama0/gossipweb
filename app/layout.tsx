import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Queens — Class of 28",
  description: "The pink Class of 28 blog, calendar, chat, polls, and weekly newspaper.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
