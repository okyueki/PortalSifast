import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const currentPageUrl = new URL(page.url, origin);

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        const urlString = toUrl(urlToCheck);

        let target: URL;
        try {
            target = urlString.startsWith('http')
                ? new URL(urlString)
                : new URL(urlString, origin);
        } catch {
            return false;
        }

        const current = currentUrl
            ? new URL(currentUrl, origin)
            : currentPageUrl;

        if (target.pathname !== current.pathname) {
            return false;
        }

        if (target.search) {
            for (const [key, value] of target.searchParams.entries()) {
                if (current.searchParams.get(key) !== value) {
                    return false;
                }
            }

            return true;
        }

        if (current.pathname === '/tickets' && current.searchParams.get('draft') === '1') {
            return false;
        }

        return true;
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentPageUrl.pathname,
        isCurrentUrl,
        whenCurrentUrl,
    };
}
