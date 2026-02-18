import { Head, Link, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Daftar User', href: '/users' },
];

type UserItem = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    simrs_nik: string | null;
    source: string | null;
    role: string;
    dep_id: string | null;
    created_at: string;
};

type PaginatedUsers = {
    data: UserItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type UserFilters = {
    search: string;
    role: string;
    dep_id: string;
};

type Props = {
    users: PaginatedUsers;
    filters: UserFilters;
};

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = useCallback(
        (newFilters: Partial<UserFilters>) => {
            router.get(
                '/users',
                { ...filters, ...newFilters },
                { preserveState: true, replace: true }
            );
        },
        [filters]
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/users', {}, { preserveState: true, replace: true });
    };

    const hasActiveFilters = !!(filters.search || filters.role || filters.dep_id);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Daftar User"
                        description="Semua user yang dapat mengakses aplikasi"
                    />
                    <Button asChild>
                        <Link href="/users/create">Tambah User</Link>
                    </Button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nama, email, atau NIK..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Cari
                        </Button>
                    </form>
                    <Select
                        value={filters.role || '_all'}
                        onValueChange={(v) => applyFilters({ role: v === '_all' ? '' : v })}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semua Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Role</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="pemohon">Pemohon</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.dep_id || '_all'}
                        onValueChange={(v) => applyFilters({ dep_id: v === '_all' ? '' : v })}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semua Dept" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Semua Dept</SelectItem>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="IPS">IPS</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20">
                                    <th className="px-4 py-3 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        NIK
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        No. HP
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Dep
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Sumber
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-0">
                                            <EmptyState
                                                title="Belum ada user"
                                                description="Tambahkan user baru untuk mengakses aplikasi."
                                                action={
                                                    <Link href="/users/create">
                                                        <Button>Tambah User</Button>
                                                    </Link>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.simrs_nik ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.phone ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        user.role === 'admin'
                                                            ? 'border-amber-400/60 bg-amber-500/15 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/25 dark:text-amber-300'
                                                            : user.role === 'staff'
                                                              ? 'border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/25 dark:text-blue-300'
                                                              : 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300'
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.dep_id ?? '–'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        user.source === 'simrs'
                                                            ? 'border-violet-400/60 bg-violet-500/15 text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/25 dark:text-violet-300'
                                                            : 'border-slate-400/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/20 dark:text-slate-300'
                                                    }
                                                >
                                                    {user.source ?? 'manual'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/users/${user.id}/edit`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
                            {users.links.map((link, i) => (
                                <span key={i}>
                                    {link.url ? (
                                        <Button
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            asChild
                                        >
                                            <Link
                                                href={link.url}
                                                preserveState
                                            >
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span
                                            className="inline-flex size-8 items-center justify-center text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-sm text-muted-foreground">
                    Total: {users.total} user
                    {users.total !== 1 ? 's' : ''}
                </p>
            </div>
        </AppLayout>
    );
}
