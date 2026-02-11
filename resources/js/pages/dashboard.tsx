import { Head, Link } from '@inertiajs/react';
import { UserCircle, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const quickLinks = [
    {
        title: 'Daftar Pegawai',
        href: '/pegawai',
        icon: UserCircle,
        gradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
        hover: 'hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5',
    },
    {
        title: 'Daftar User',
        href: '/users',
        icon: Users,
        gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
        hover: 'hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 p-5 dark:from-violet-500/20 dark:via-fuchsia-500/20 dark:to-violet-500/20">
                    <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-violet-400 dark:to-fuchsia-400">
                        Selamat datang
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola pegawai dan user akses aplikasi dari sini.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {quickLinks.map(
                        ({ title, href, icon: Icon, gradient, hover }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 ${hover} dark:border-white/10`}
                            >
                                <div
                                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${gradient} shadow-md`}
                                >
                                    <Icon className="size-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-semibold text-foreground">
                                        {title}
                                    </span>
                                </div>
                            </Link>
                        ),
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
