import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AUTO_DISMISS_MS = 5000;

export function FlashMessage() {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string; syncSuccess?: boolean };
    }>().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const err = flash?.error;
        const success = flash?.success;
        if (err) {
            setMessage({ type: 'error', text: err });
            setVisible(true);
        } else if (success) {
            setMessage({ type: 'success', text: success });
            setVisible(true);
        } else {
            setVisible(false);
            setMessage(null);
        }
    }, [flash?.error, flash?.success]);

    useEffect(() => {
        if (!visible || !message) return;
        const t = setTimeout(() => {
            setVisible(false);
            setMessage(null);
        }, AUTO_DISMISS_MS);
        return () => clearTimeout(t);
    }, [visible, message]);

    if (!visible || !message) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
            <Alert
                variant={message.type === 'error' ? 'destructive' : 'default'}
                className={
                    message.type === 'success'
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 [&>svg]:text-green-600 dark:[&>svg]:text-green-400'
                        : ''
                }
            >
                {message.type === 'success' ? (
                    <CheckCircle className="size-4 shrink-0 translate-y-0.5" />
                ) : (
                    <XCircle className="size-4 shrink-0 translate-y-0.5" />
                )}
                <AlertDescription
                    className={
                        message.type === 'success'
                            ? 'text-green-800 dark:text-green-200'
                            : ''
                    }
                >
                    {message.text}
                </AlertDescription>
            </Alert>
        </div>
    );
}
