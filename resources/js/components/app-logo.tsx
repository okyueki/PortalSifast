import AppLogoIcon from './app-logo-icon';

const APP_NAME = 'Sika';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm min-w-0">
                <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
                    {APP_NAME}
                </span>
            </div>
        </>
    );
}
