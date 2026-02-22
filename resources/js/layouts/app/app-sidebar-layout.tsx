import { useState } from 'react';
import { PresenceProvider } from '@/contexts/presence-context';
import { FlashMessage } from '@/components/flash-message';
import { TemplateHeader } from '@/components/template-header';
import { TemplateMobileNav } from '@/components/template-mobile-nav';
import { TemplateSidebar } from '@/components/template-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <PresenceProvider>
        <div className="min-h-screen bg-background">
            <FlashMessage />
            <TemplateSidebar />
            <TemplateMobileNav
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
            />
            <main className="md:ml-64">
                <TemplateHeader
                    breadcrumbs={breadcrumbs}
                    onMenuClick={() => setMobileMenuOpen(true)}
                />
                <div className="p-4 md:p-6">{children}</div>
            </main>
        </div>
        </PresenceProvider>
    );
}
