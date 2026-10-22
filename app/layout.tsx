import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEO Labs Wiki",
  description: "Living wiki for NEO Labs work",
};

// analyticsOS, our own analytics. Nothing loads unless both variables are set,
// so leaving the key empty switches it off per environment.
const analyticsHost = process.env.NEXT_PUBLIC_ANALYTICS_HOST;
const analyticsKey = process.env.NEXT_PUBLIC_ANALYTICS_KEY;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        {analyticsHost && analyticsKey && (
          <Script src={`${analyticsHost}/s/${analyticsKey}.js`} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
