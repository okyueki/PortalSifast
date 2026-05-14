<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSimmutuInputAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->canRecordMutuRealisation()) {
            abort(403, 'Anda tidak memiliki akses input realisasi mutu.');
        }

        return $next($request);
    }
}
