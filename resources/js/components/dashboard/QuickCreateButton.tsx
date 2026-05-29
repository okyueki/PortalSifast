import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickCreateButton() {
    return (
        <Button
            asChild
            size="lg"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
            style={{ borderRadius: '50%' }}
        >
            <Link href="/tickets/create">
                <Plus className="h-6 w-6" />
            </Link>
        </Button>
    );
}