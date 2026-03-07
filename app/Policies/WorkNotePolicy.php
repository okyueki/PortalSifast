<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkNote;

class WorkNotePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     * Hanya pembuat (owner) dan admin yang boleh akses.
     */
    public function view(User $user, WorkNote $workNote): bool
    {
        return $workNote->user_id === $user->id || $user->isAdmin();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WorkNote $workNote): bool
    {
        return $workNote->user_id === $user->id || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WorkNote $workNote): bool
    {
        return $workNote->user_id === $user->id || $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WorkNote $workNote): bool
    {
        return $workNote->user_id === $user->id || $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WorkNote $workNote): bool
    {
        return $workNote->user_id === $user->id || $user->isAdmin();
    }
}
