import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    status: number;
};

const messages: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses Ditolak',
        description:
            'Anda tidak memiliki izin untuk mengakses halaman ini.',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description:
            'Halaman yang Anda cari tidak ada atau telah dipindahkan.',
    },
    500: {
        title: 'Kesalahan Server',
        description:
            'Terjadi kesalahan di server. Silakan coba lagi nanti.',
    },
    503: {
        title: 'Layanan Tidak Tersedia',
        description:
            'Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.',
    },
};

export default function ErrorPage({ status }: Props) {
    const { title, description } = messages[status] ?? {
        title: 'Terjadi Kesalahan',
        description: 'Silakan coba lagi.',
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <Head title={title} />
            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        {status === 403 ? (
                            <ShieldAlert className="size-10" />
                        ) : (
                            <AlertTriangle className="size-10" />
                        )}
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-2 text-muted-foreground">{description}</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                    Kode: {status}
                </p>
                <div className="mt-8">
                    <Button asChild>
                        <Link href="/">
                            <Home className="mr-2 size-4" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
