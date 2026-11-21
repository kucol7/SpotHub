import type { Metadata } from "next";
import "./globals.css";
import { UserLibraryProvider } from "../components/user-library-context";

export const metadata: Metadata = {
  title: "Spot Hub",
  description: "Brama dostępu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="antialiased">
        <UserLibraryProvider>{children}</UserLibraryProvider>
      </body>
    </html>
  );
}
