import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Backlog | Minimalist Media Tracker',
  description:
    'Track your Games, Movies, Series, and Books backlog with local-first storage and JSON backup.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0D0F11] text-[#F3F4F6] antialiased">
        {children}
      </body>
    </html>
  );
}
