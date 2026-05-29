import { Link } from '@inertiajs/react';
import { Ticket, AlertTriangle, Users } from 'lucide-react';

const actions = [
    { title: 'Tiket Saya', href: '/tickets?assignee=me', icon: Ticket },
    { title: 'Belum Ditugaskan', href: '/tickets?unassigned=1', icon: Users },
    { title: 'SLA Warning', href: '/tickets?sla_warning=1', icon: AlertTriangle },
];

export function QuickActionsBar() {
    return (
        <div className="flex flex-wrap gap-2">
            {actions.map(({ title, href, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
                >
                    <Icon className="h-4 w-4" />
                    {title}
                </Link>
            ))}
        </div>
    );
}