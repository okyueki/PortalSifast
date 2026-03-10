import { useEffect } from 'react';
import { Form, Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Telegram',
        href: '/settings/telegram',
    },
];

export default function Telegram({
    telegramConnected,
    telegramBotUsername,
    connectLink,
}: {
    telegramConnected: boolean;
    telegramBotUsername: string | null;
    connectLink?: string | null;
}) {
    useEffect(() => {
        if (connectLink) {
            window.open(connectLink, '_blank', 'noopener,noreferrer');
        }
    }, [connectLink]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Telegram" />

            <h1 className="sr-only">Pengaturan Telegram</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Integrasi Telegram"
                        description="Terima notifikasi tiket baru di Telegram dan simpan catatan dari Telegram yang bisa dilihat di portal."
                    />

                    <div className="rounded-lg border border-border bg-card p-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="font-medium">
                                    Status: {telegramConnected ? 'Terhubung' : 'Belum terhubung'}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {telegramConnected
                                        ? 'Anda akan menerima notifikasi tiket (baru, ditugaskan, komentar) di Telegram. Kirim pesan ke bot untuk menyimpan sebagai Catatan Kerja.'
                                        : 'Hubungkan akun Telegram untuk menerima notifikasi tiket dan menyimpan catatan dari Telegram.'}
                                </p>
                            </div>

                            {telegramConnected ? (
                                <Form
                                    method="post"
                                    action="/settings/telegram/disconnect"
                                    className="inline"
                                >
                                    <Button type="submit" variant="outline" size="sm">
                                        Lepaskan Telegram
                                    </Button>
                                </Form>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                        router.post('/settings/telegram/connect')
                                    }
                                    disabled={!telegramBotUsername}
                                >
                                    Hubungkan Telegram
                                </Button>
                            )}

                            {!telegramBotUsername && (
                                <p className="text-sm text-amber-600 dark:text-amber-500">
                                    Admin belum mengonfigurasi bot Telegram (TELEGRAM_BOT_USERNAME).
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
