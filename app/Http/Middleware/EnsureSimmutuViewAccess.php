<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSimmutuViewAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->canAccessSimmutuModule()) {
            abort(403, 'Anda tidak memiliki akses ke modul SIMMUTU.');
        }

        return $next($request);
    }
}
