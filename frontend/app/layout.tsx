import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { defaultLocale, locales } from '@/i18n/routing';
import type { Metadata } from 'next';
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
