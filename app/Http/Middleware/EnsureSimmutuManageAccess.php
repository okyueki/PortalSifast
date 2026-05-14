<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSimmutuManageAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->canManageMutu()) {
            abort(403, 'Anda tidak memiliki akses kelola master SIMMUTU.');
        }

        return $next($request);
    }
}
