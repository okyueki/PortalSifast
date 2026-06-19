export type SikatSuratNavItem = {
    id: string;
    label: string;
    to: string;
};

/**
 * Menu Surat Menyurat SIKAT legacy — mirror navbar SIKAT.
 * Link mengarah ke route Portal yang generate token SSO lalu redirect.
 */
export const sikatSuratNavItems: SikatSuratNavItem[] = [
    { id: 'surat-masuk', label: 'Surat Masuk', to: '/surat_masuk' },
    { id: 'surat-keluar', label: 'Surat Keluar', to: '/surat_keluar' },
    { id: 'surat-edaran', label: 'Surat Edaran', to: '/surat_edaran' },
    { id: 'spo', label: 'SPO', to: '/spo' },
];

export const sikatSuratCutiNavItems: SikatSuratNavItem[] = [
    { id: 'cuti', label: 'Pengajuan Cuti / Libur', to: '/cuti' },
    {
        id: 'verifikasi-cuti',
        label: 'Verifikasi Cuti / Libur',
        to: '/verifikasi_pengajuan_libur',
    },
];

export const sikatSuratIjinNavItems: SikatSuratNavItem[] = [
    { id: 'ijin', label: 'Pengajuan Ijin', to: '/ijin' },
    {
        id: 'verifikasi-ijin',
        label: 'Verifikasi Ijin',
        to: '/verifikasi_pengajuan_libur',
    },
];

export const sikatSuratLemburNavItems: SikatSuratNavItem[] = [
    { id: 'lembur', label: 'Pengajuan Lembur', to: '/pengajuan_lembur' },
    {
        id: 'verifikasi-lembur',
        label: 'Verifikasi Lembur',
        to: '/verifikasi_pengajuan_lembur',
    },
];

export const sikatSuratMasterNavItems: SikatSuratNavItem[] = [
    { id: 'sifat-surat', label: 'Sifat Surat', to: '/sifat_surat' },
    { id: 'klasifikasi-surat', label: 'Klasifikasi Surat', to: '/klasifikasi_surat' },
];

export function sikatGoHref(to: string): string {
    return `/integrations/sikat/go?${new URLSearchParams({ to }).toString()}`;
}

export const allSikatSuratNavItems: SikatSuratNavItem[] = [
    ...sikatSuratNavItems,
    ...sikatSuratCutiNavItems,
    ...sikatSuratIjinNavItems,
    ...sikatSuratLemburNavItems,
    ...sikatSuratMasterNavItems,
];
