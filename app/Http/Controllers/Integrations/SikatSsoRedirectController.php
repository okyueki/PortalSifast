<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Services\SikatSsoTokenService;
use App\Support\SikatRedirectPath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SikatSsoRedirectController extends Controller
{
    public function __invoke(Request $request, SikatSsoTokenService $sso): RedirectResponse
    {
        if (! $sso->isConfigured()) {
            abort(503, 'Integrasi SIKAT belum siap.');
        }

        $to = (string) $request->query('to', '');

        if (! SikatRedirectPath::isAllowed($to)) {
            abort(400, 'Tujuan tidak diizinkan.');
        }

        $user = $request->user();

        if ($user === null || blank($user->simrs_nik)) {
            return redirect()
                ->route('dashboard')
                ->with('error', 'NIK belum terhubung. Hubungi admin.');
        }

        return redirect()->away($sso->buildRedirectUrl($user->simrs_nik, $to));
    }
}
