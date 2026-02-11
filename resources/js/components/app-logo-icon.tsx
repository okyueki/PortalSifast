import type { SVGAttributes } from 'react';

/**
 * Sika logo mark – stylized "S" for branding.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4Zm0 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4c-2.5 0-4.5 1.8-4.5 4.2 0 1.4.7 2.6 1.8 3.4-.9.6-1.5 1.5-1.5 2.6 0 1.8 1.6 3.2 3.5 3.2s3.5-1.4 3.5-3.2c0-1.1-.6-2-1.5-2.6 1.1-.8 1.8-2 1.8-3.4C20.5 11.8 18.5 10 16 10Zm0 2c1.4 0 2.5 1 2.5 2.2 0 1.2-1.1 2.2-2.5 2.2s-2.5-1-2.5-2.2c0-1.2 1.1-2.2 2.5-2.2Zm0 6.6c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6-1.6-.7-1.6-1.6.7-1.6 1.6-1.6Z"
                fill="currentColor"
            />
        </svg>
    );
}
