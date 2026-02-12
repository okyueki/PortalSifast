<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff() || $user->isPemohon();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isStaff()) {
            return $ticket->dep_id === $user->dep_id
                || $ticket->assignee_id === $user->id
                || $ticket->requester_id === $user->id
                || $ticket->collaborators()->where('user_id', $user->id)->exists()
                || $ticket->group?->members()->where('user_id', $user->id)->exists();
        }

        if ($user->isPemohon()) {
            return $ticket->requester_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff() || $user->isPemohon();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Ticket $ticket): bool
    {
        return $this->canEdit($user, $ticket);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can assign the ticket.
     */
    public function assign(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isStaff()) {
            // Staff departemen sama
            if ($ticket->dep_id === $user->dep_id) {
                return true;
            }
            // Atau staff anggota grup tiket (bisa ambil dari pool grup)
            if ($ticket->ticket_group_id) {
                return $ticket->group?->members()->where('user_id', $user->id)->exists() ?? false;
            }
        }

        return false;
    }

    /**
     * Determine whether the user can change ticket status.
     */
    public function changeStatus(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isStaff() && ($ticket->assignee_id === $user->id || $ticket->dep_id === $user->dep_id);
    }

    /**
     * Determine whether the user can set due date (kategori Pengembangan Aplikasi).
     */
    public function setDueDate(User $user, Ticket $ticket): bool
    {
        if (! $ticket->isDevelopment()) {
            return false;
        }

        return $user->isAdmin();
    }

    /**
     * Determine whether the user can confirm ticket closure (pemohon).
     */
    public function confirmClosure(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->requester_id;
    }

    /**
     * Determine whether the user can add comment to the ticket.
     */
    public function comment(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    /**
     * Determine whether the user can add attachment to the ticket.
     */
    public function attach(User $user, Ticket $ticket): bool
    {
        return $this->canEdit($user, $ticket);
    }

    /**
     * Determine whether the user can add/remove collaborators (rekan).
     * Admin atau staff yang bisa edit tiket.
     */
    public function manageCollaborators(User $user, Ticket $ticket): bool
    {
        return $this->canEdit($user, $ticket);
    }

    /**
     * Determine whether the user can add/edit/remove vendor costs.
     */
    public function manageVendorCosts(User $user, Ticket $ticket): bool
    {
        return $this->canEdit($user, $ticket);
    }

    private function canEdit(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isStaff() && ($ticket->dep_id === $user->dep_id || $ticket->assignee_id === $user->id);
    }
}
