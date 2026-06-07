import AppLogoIcon from './app-logo-icon';

const APP_NAME = 'Portal Sifast';
const APP_SUBTITLE = 'RS Aisyiyah Siti Fatimah';

export default function AppLogo() {
    return (
        <>
            {/* Logo mark — clean blue gradient */}
            <div
                className="flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm"
                style={{
                    background: 'linear-gradient(135deg, oklch(0.55 0.18 250) 0%, oklch(0.45 0.20 250) 100%)',
                    boxShadow: '0 1px 4px oklch(0 0 0 / 0.12)',
                }}
            >
                <AppLogoIcon
                    className="fill-current"
                    style={{ color: '#ffffff' }}
                />
            </div>

            {/* Wordmark */}
            <div className="ml-2.5 grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                    {APP_NAME}
                </span>
                <span className="truncate text-xs font-normal text-sidebar-muted">
                    {APP_SUBTITLE}
                </span>
            </div>
        </>
    );
}