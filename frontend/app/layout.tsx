import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { defaultLocale, locales } from '@/i18n/routing';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Manrope } from 'next/font/google';
import { cookies } from 'next/headers';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Software Jars',
  description: 'A hub of small apps that each do one thing.',
  // iOS Safari's "Add to Home Screen" predates and diverges from the
  // standard Web App Manifest spec (app/manifest.ts) — these are required
  // separately for iOS to pick up the right icon and hide browser chrome.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Software Jars',
  },
  icons: {
    apple: '/icon-192.png',
  },
  // Next only emits the modern, non-prefixed `mobile-web-app-capable` tag
  // from appleWebApp.capable above — older iOS Safari versions specifically
  // check the vendor-prefixed one, so it's added here for broader coverage.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
};

const RootLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale = (locales as readonly string[]).includes(raw ?? '') ? raw! : defaultLocale;
  const messages = await getMessages();

  return (
    <html lang={locale} className={manrope.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
