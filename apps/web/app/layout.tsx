import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRADEX — Trading Journal",
  description: "Institutional-grade trading journal and smart money insights platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-900 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  );
}
