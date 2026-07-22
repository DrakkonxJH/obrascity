import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://obrascity.com.br"
  ),
  title: "ObrasCitY — Gestão de Obras em Perfeita Sincronia | AtlasTech",
  description:
    "Plataforma da AtlasTech que conecta canteiro e escritório em tempo real. RDO, BIM 3D, finanças e suprimentos.",
  openGraph: {
    title: "ObrasCitY — Gestão de Obras em Perfeita Sincronia",
    description: "Do canteiro ao escritório. Em tempo real.",
    type: "website",
    images: [{ url: "/images/crane-sunset.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full overflow-x-hidden bg-[var(--of-bg)] text-[var(--of-text)]">
        {children}
      </body>
    </html>
  );
}
