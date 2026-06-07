import type { SVGAttributes } from 'react';

/**
 * Portal Sifast — clean medical/health cross icon.
 * Simple, geometric, scalable.
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
            {/* Vertical bar */}
            <rect
                x="13"
                y="6"
                width="6"
                height="20"
                rx="3"
                fill="currentColor"
            />
            {/* Horizontal bar */}
            <rect
                x="6"
                y="13"
                width="20"
                height="6"
                rx="3"
                fill="currentColor"
            />
        </svg>
    );
}