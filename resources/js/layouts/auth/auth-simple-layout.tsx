import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link
                        href={home()}
                        className="inline-flex flex-col items-center gap-2"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                            <AppLogoIcon className="h-7 w-7 fill-primary-foreground text-primary-foreground" />
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>
                    <h1 className="mt-4 text-2xl font-bold text-foreground">
                        Sika
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-foreground">
                        {title}
                    </h2>
                    {children}
                </div>
            </div>
        </div>
    );
}
