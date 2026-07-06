import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "College Visitor",
  description: "Find, compare, wishlist, and apply to colleges with College Visitor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="antialiased bg-[#07191b]"
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-x-hidden bg-[#07191b] text-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}