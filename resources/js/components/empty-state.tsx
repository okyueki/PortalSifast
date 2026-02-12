import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
};

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: Props) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 py-12 px-6 text-center',
                className
            )}
        >
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {icon ?? <Inbox className="size-7" />}
            </div>
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
