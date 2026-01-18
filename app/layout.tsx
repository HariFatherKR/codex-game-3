import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infinite Runner",
  description: "Canvas 기반 2D 인피니트 러너"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
