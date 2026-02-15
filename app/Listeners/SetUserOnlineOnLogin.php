<?php

namespace App\Listeners;

use App\Services\UserPresenceService;
use Illuminate\Auth\Events\Login;

class SetUserOnlineOnLogin
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $this->userPresenceService->setUserOnline($event->user);
    }
}
