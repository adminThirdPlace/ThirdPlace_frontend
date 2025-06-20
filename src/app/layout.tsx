import type { Metadata } from "next";
import { Crimson_Pro } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next"
// Import Crimson Pro font
const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Third Place",
  description: "Real Connections, Real Life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en">
        <body className={`${crimsonPro.variable} antialiased`}>
          {children}
            <SpeedInsights />
        </body>
      </html>
    </AuthProvider>
  );
}
