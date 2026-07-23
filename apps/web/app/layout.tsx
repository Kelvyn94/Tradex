import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
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
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(222 40% 9%)",
              color: "hsl(210 20% 92%)",
              border: "1px solid hsl(217 25% 17%)",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "hsl(152 100% 45%)", secondary: "hsl(222 40% 9%)" } },
            error: { iconTheme: { primary: "hsl(350 89% 60%)", secondary: "hsl(222 40% 9%)" } },
          }}
        />
      </body>
    </html>
  );
}
