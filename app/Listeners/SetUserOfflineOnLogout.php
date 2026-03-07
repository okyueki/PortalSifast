<?php

namespace App\Listeners;

use App\Services\UserPresenceService;
use Illuminate\Auth\Events\Logout;

class SetUserOfflineOnLogout
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        $this->userPresenceService->setUserOffline($event->user);
    }
}
