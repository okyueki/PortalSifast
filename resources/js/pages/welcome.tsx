import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Selamat datang" />
            <div className="relative flex min-h-screen flex-col items-center overflow-hidden p-6 text-foreground lg:justify-center lg:p-8">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-200/40 via-fuchsia-100/30 to-violet-200/40 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-violet-950/40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.7_0.2_290_/_.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.5_0.2_290_/_.25),transparent)]" />
                <header className="relative z-10 mb-6 w-full max-w-[335px] text-sm lg:max-w-2xl">
                    <nav className="flex items-center justify-end gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
                                    >
                                        Daftar
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center lg:grow">
                    <main className="flex w-full max-w-md flex-col items-center text-center">
                        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-0.5 shadow-xl shadow-violet-500/25 dark:shadow-violet-500/20">
                            <div className="flex size-full items-center justify-center rounded-2xl bg-white/10 dark:bg-black/20">
                                <AppLogoIcon className="size-10 fill-current text-white" />
                            </div>
                        </div>
                        <h1 className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400">
                            Sika
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Aplikasi manajemen pegawai dan user untuk rumah sakit.
                        </p>
                        {!auth.user && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={login()}
                                    className="inline-flex items-center justify-center rounded-xl border-2 border-violet-300 bg-white/80 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:border-violet-400 hover:bg-white dark:border-violet-600 dark:bg-white/10 dark:hover:bg-white/20"
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-95 hover:shadow-violet-500/40"
                                    >
                                        Daftar akun
                                    </Link>
                                )}
                            </div>
                        )}
                    </main>
                </div>
                <div className="hidden h-14 lg:block" />
            </div>
        </>
    );
}
