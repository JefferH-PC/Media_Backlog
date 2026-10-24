import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backlog — Media Archive',
  description:
    'A focused, local-first archive for games, movies, series, and books with instant JSON backup.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
