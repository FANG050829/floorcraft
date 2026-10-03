import type { Metadata, Viewport } from "next";
import { Sora, Noto_Sans_SC, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FLOORCRAFT · 铺面工坊 — 商业空间规划",
  description:
    "为咖啡馆、小型办公室和精品零售店设计的 3D 商业空间规划器。实时 3D 与平面图切换、品牌色应用、容量与消防疏散规划、成本估算与 PDF 导出。",
  keywords: [
    "空间规划", "3D 设计", "咖啡馆设计", "办公室布局", "精品店规划",
    "商业空间", "平面图", "消防疏散", "成本估算", "FLOORCRAFT",
  ],
  authors: [{ name: "FLOORCRAFT" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "FLOORCRAFT · 铺面工坊 — 商业空间规划",
    description: "为咖啡馆、小型办公室和精品零售店设计的 3D 商业空间规划器。",
    siteName: "FLOORCRAFT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F2E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${sora.variable} ${notoSC.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
