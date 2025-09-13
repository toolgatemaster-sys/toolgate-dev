import "./globals.css";
import ThemeRoot from "../components/ThemeRoot";

export const metadata = { title: "Toolgate" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ThemeRoot>{children}</ThemeRoot></body>
    </html>
  );
}
