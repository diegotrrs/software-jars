import { defaultLocale } from '@/i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

export const proxy = (request: NextRequest): NextResponse => {
  const response = NextResponse.next();

  // Only set locale cookie on first visit — never overwrite an explicit user choice.
  // Only one locale exists today; this seeds the same cookie-based scheme kino uses
  // so adding locales later doesn't require restructuring.
  if (!request.cookies.get('locale')) {
    response.cookies.set('locale', defaultLocale, {
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
