"use client"; // Required for ThemeProvider if it uses client-side hooks like useState/useEffect

import type { Metadata } from "next"; // Metadata can still be exported from client components
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext"; // Import CartProvider
import { useEffect } from "react";

// export const metadata: Metadata = { // Cannot export metadata from a client component like this directly
//   title: "سایت من",
//   description: "یک وبسایت نمونه با Next.js و Tailwind CSS",
// };
// Instead, metadata should be handled in a parent server component or via the new metadata APIs if needed differently.
// For now, let's assume the existing metadata object is fine at a higher level or this simplification is acceptable.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This useEffect is a workaround to set the title and description
  // if direct metadata export is problematic in a "use client" component.
  // However, Next.js prefers metadata to be exported statically.
  // For this exercise, we'll keep it simple.
  useEffect(() => {
    document.title = "سایت من";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "یک وبسایت نمونه با Next.js و Tailwind CSS");
    }
  }, []);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning> {/* suppressHydrationWarning is often needed with theme persistence */}
      <body className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          <CartProvider> {/* Wrap with CartProvider */}
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
