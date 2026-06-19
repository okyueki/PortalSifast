<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ResolveUserByNikService;
use App\Services\SikatSsoTokenService;
use App\Support\PortalRedirectPath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class SikatInboundSsoController extends Controller
{
    public function __invoke(
        Request $request,
        SikatSsoTokenService $sso,
        ResolveUserByNikService $resolveUserByNik,
    ): RedirectResponse {
        if (! $sso->isConfigured()) {
            abort(503, 'Integrasi SIKAT belum siap.');
        }

        $token = $request->query('token');
        $redirect = (string) $request->query('redirect', '/dashboard');

        if (! is_string($token) || $token === '') {
            abort(400, 'Token wajib diisi.');
        }

        if (! PortalRedirectPath::isAllowed($redirect)) {
            abort(400, 'Tujuan tidak diizinkan.');
        }

        try {
            $payload = $sso->validateToken($token);
        } catch (RuntimeException $exception) {
            abort(403, $exception->getMessage());
        }

        $user = User::query()->where('simrs_nik', $payload['nik'])->first()
            ?? $resolveUserByNik->findOrCreate($payload['nik']);

        if ($user === null) {
            abort(403, 'Akun Portal tidak ditemukan untuk NIK ini.');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect($redirect);
    }
}
