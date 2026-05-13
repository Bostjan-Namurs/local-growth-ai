import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalGrowth AI Admin",
  description: "LocalGrowth AI admin operations"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
