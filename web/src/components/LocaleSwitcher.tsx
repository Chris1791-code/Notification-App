'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const activeLocale = (params.locale as string) ?? routing.defaultLocale;

  function switchTo(locale: string) {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchTo(locale)}
          className={`rounded px-2 py-1 uppercase ${
            locale === activeLocale ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
