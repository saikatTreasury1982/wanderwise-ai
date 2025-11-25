import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'WanderWise - Plan Smarter, Travel Better',
  description: 'Travel planning and budgeting made easy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}