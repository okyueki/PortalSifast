import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Tiket', href: '/tickets' },
    { title: 'Impor CSV', href: '/tickets/import' },
];

type Props = {
    templateUrl: string;
};

export default function TicketImport({ templateUrl }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.file) return;
        post('/tickets/import', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Impor Tiket dari CSV" />

            <div className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/tickets">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Impor Tiket dari CSV"
                        description="Unggah file CSV untuk membuat banyak tiket sekaligus. Gunakan template untuk format yang benar."
                    />
                </div>

                <div className="rounded-xl border bg-card p-6 space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <a href={templateUrl} download>
                                <FileDown className="mr-2 h-4 w-4" />
                                Unduh template CSV
                            </a>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Kolom: Judul, Tipe, Kategori, Prioritas, Pemohon (email), Departemen, Deskripsi
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="file">
                                Pilih file CSV
                            </label>
                            <Input
                                id="file"
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                className="cursor-pointer"
                            />
                            {errors.file && (
                                <p className="text-sm text-destructive">{errors.file}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing || !data.file}>
                                <Upload className="mr-2 h-4 w-4" />
                                {processing ? 'Mengimpor...' : 'Impor'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/tickets">Batal</Link>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
