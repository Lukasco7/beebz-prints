import type { Metadata } from "next";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "BEEBZ PRINTS",
    template: "%s | BEEBZ PRINTS",
  },
  description:
    "Professional printing and creative branding services for businesses, organizations, and individuals.",
  icons: {
    icon: "/api/favicon",
    shortcut: "/api/favicon",
    apple: "/api/favicon",
  },
  verification: {
    google: "_8UlcuTCoAHKN0ONCMj9h9QIXpwERzluS2YoCz7uvFs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/api/favicon" />
        <link rel="shortcut icon" href="/api/favicon" />
        <link rel="apple-touch-icon" href="/api/favicon" />
      </head>
      <body>{children}</body>
    </html>
  );
}