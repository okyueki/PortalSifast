import type { LucideIcon } from 'lucide-react';
import { BarChart3, Building2, ClipboardList, LayoutGrid, ListFilter, PlusCircle, Target } from 'lucide-react';

export type SimmutuNavPermissions = {
    can_view?: boolean;
    can_manage?: boolean;
    can_input?: boolean;
};

export type NavItem = {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    isActive: (path: string) => boolean;
};

export type NavGroup = {
    id: string;
    label: string;
    icon: LucideIcon;
    items: NavItem[];
};

export function buildSimmutuNavGroup(perm?: SimmutuNavPermissions): NavGroup | null {
    if (!perm?.can_view) {
        return null;
    }

    const items: NavItem[] = [
        {
            id: 'simmutu-dashboard',
            label: 'Dashboard SIMMUTU',
            href: '/simmutu',
            icon: LayoutGrid,
            isActive: (path) => path === '/simmutu',
        },
        {
            id: 'simmutu-recap-departments',
            label: 'Rekap per Departemen',
            href: '/simmutu/recap/departments',
            icon: BarChart3,
            isActive: (path) => path.startsWith('/simmutu/recap/departments'),
        },
        {
            id: 'simmutu-rekap-mutu',
            label: 'Rekap Mutu',
            href: '/simmutu/realisations',
            icon: ClipboardList,
            isActive: (path) =>
                path.startsWith('/simmutu/realisations') && path !== '/simmutu/realisations/create',
        },
        {
            id: 'simmutu-unit-kerja',
            label: 'Unit kerja',
            href: '/simmutu/unit-kerja',
            icon: Building2,
            isActive: (path) => path.startsWith('/simmutu/unit-kerja'),
        },
    ];

    if (perm.can_manage) {
        items.push(
            {
                id: 'simmutu-categories',
                label: 'Kategori Mutu',
                href: '/simmutu/categories',
                icon: ListFilter,
                isActive: (path) => path.startsWith('/simmutu/categories'),
            },
            {
                id: 'simmutu-indicators',
                label: 'Profil Indikator',
                href: '/simmutu/indicators',
                icon: BarChart3,
                isActive: (path) => path.startsWith('/simmutu/indicators'),
            },
        );
    }

    if (perm.can_input) {
        items.push({
            id: 'simmutu-realisations-create',
            label: 'Input Realisasi',
            href: '/simmutu/realisations/create',
            icon: PlusCircle,
            isActive: (path) => path === '/simmutu/realisations/create',
        });
    }

    return {
        id: 'simmutu',
        label: 'SIMMUTU',
        icon: Target,
        items,
    };
}
