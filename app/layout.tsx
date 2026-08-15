import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import SessionGuard from '@/app/components/organisms/SessionGuard';
import { ThemeProvider } from './components/ThemeProvider';

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
    <html lang="en" data-theme="aurora-dreams" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('wl-theme');
    var valid = ['aurora-dreams','midnight-ocean','warm-sunset','forest-expedition','coastal-depths','classic-light'];
    if (t && valid.indexOf(t) !== -1) {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
        `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <SessionGuard />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}