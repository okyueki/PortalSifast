<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'permissions' => [
                'can_access_payroll' => $request->user()?->canAccessPayroll() ?? false,
                'can_manage_payroll_access' => $request->user()?->canManagePayrollAccess() ?? false,
                'simmutu' => [
                    'can_view' => $request->user()?->canAccessSimmutuModule() ?? false,
                    'can_manage' => $request->user()?->canManageMutu() ?? false,
                    'can_input' => $request->user()?->canRecordMutuRealisation() ?? false,
                    'can_manage_user_flags' => $request->user()?->canManageMutuAccess() ?? false,
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'syncSuccess' => $request->session()->get('syncSuccess'),
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'errors' => $request->session()->get('errors')?->getBag('default')->getMessages(),
        ];
    }
}
