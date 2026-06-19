<?php

namespace App\Support;

class PortalRedirectPath
{
    public static function isAllowed(string $path): bool
    {
        if ($path === '' || ! str_starts_with($path, '/') || str_contains($path, '://')) {
            return false;
        }

        /** @var list<string> $allowedPaths */
        $allowedPaths = config('sikat.allowed_inbound_redirect_paths') ?? [];

        foreach ($allowedPaths as $allowed) {
            if ($path === $allowed || str_starts_with($path, $allowed.'/')) {
                return true;
            }
        }

        return false;
    }
}
