import "./globals.css";

export const metadata = {
  title: "Infinite Runner",
  description: "Canvas 기반 2D infinite runner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
