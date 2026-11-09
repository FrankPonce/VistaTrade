import type { Metadata, Viewport } from 'next';
import { Inter, Michroma, Mr_Dafoe } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { LivePrices } from '@/components/LivePrices';
import { AchievementWatcher } from '@/components/AchievementWatcher';
import { Toaster } from '@/components/Toaster';
import { Disclaimer } from '@/components/Disclaimer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const display = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const script = Mr_Dafoe({ subsets: ['latin'], weight: '400', variable: '--font-script' });

export const metadata: Metadata = {
  title: { default: 'VistaTrade', template: '%s · VistaTrade' },
  description: 'Paper trading, a beginner course and an honest forecasting experiment. Virtual money, real market data.',
};

export const viewport: Viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${script.variable}`}>
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6">{children}</main>
        <Disclaimer />
        <LivePrices />
        <AchievementWatcher />
        <Toaster />
      </body>
    </html>
  );
}
