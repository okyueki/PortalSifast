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
        gradient: 'bg-primary',
        hover: 'hover:opacity-90 hover:-translate-y-0.5',
    },
    {
        title: 'Daftar User',
        href: '/users',
        icon: Users,
        gradient: 'bg-primary',
        hover: 'hover:opacity-90 hover:-translate-y-0.5',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
                                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${gradient} text-primary-foreground shadow-md`}
                                >
                                    <Icon className="size-6" />
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
