import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "PayFlow AI",
  description: "Invoice, get paid, follow up — without the spreadsheet.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before paint to avoid a flash of the wrong theme. Reads
            the saved preference, falling back to the OS setting. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem("payflow-theme");
                  var theme = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  if (theme === "dark") document.documentElement.dataset.theme = "dark";
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
