import type { LucideIcon } from 'lucide-react';
import { Mail } from 'lucide-react';
import {
    allSikatSuratNavItems,
    sikatGoHref,
    type SikatSuratNavItem,
} from '@/config/sikatSuratNav';

export type NavItem = {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    isActive: (path: string) => boolean;
    /** Full page navigation (SSO redirect), not Inertia SPA */
    fullPage?: boolean;
};

export type NavGroup = {
    id: string;
    label: string;
    icon: LucideIcon;
    items: NavItem[];
};

function toNavItem(item: SikatSuratNavItem): NavItem {
    return {
        id: item.id,
        label: item.label,
        href: sikatGoHref(item.to),
        icon: Mail,
        isActive: () => false,
        fullPage: true,
    };
}

export function buildSikatNavGroup(enabled?: boolean): NavGroup | null {
    if (!enabled) {
        return null;
    }

    return {
        id: 'sikat-surat',
        label: 'Surat Menyurat',
        icon: Mail,
        items: allSikatSuratNavItems.map(toNavItem),
    };
}
