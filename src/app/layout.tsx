import type { Metadata } from 'next';
import './globals.css';
import { PantryProvider } from '@/context/PantryContext';

export const metadata: Metadata = {
  title: 'Pantry Tracker',
  description: 'Track your pantry inventory and discover recipes',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PantryProvider>{children}</PantryProvider>
      </body>
    </html>
  );
}
