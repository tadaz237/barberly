import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/src/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Barberly",
  title: {
    default: "Barberly",
    template: "%s | Barberly",
  },
  description:
    "Barberly - la plateforme qui connecte les coiffeuses et coiffeurs à domicile avec leurs clientes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Barberly",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
