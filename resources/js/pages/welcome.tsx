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
            <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background p-6 text-foreground lg:justify-center lg:p-8">
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
                                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
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
                        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
                            <AppLogoIcon className="size-10 fill-current text-primary-foreground" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            Portal RS Aisyiyah Siti Fatimah
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Aplikasi manajemen pegawai dan user untuk rumah sakit.
                        </p>
                        {!auth.user && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={login()}
                                    className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground"
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-95"
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
