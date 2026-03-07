<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketCollaborator;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TicketCollaboratorController extends Controller
{
    /**
     * Add a collaborator (rekan) to the ticket.
     * Rekan = staff (boleh satu departemen atau beda), bukan primary assignee.
     */
    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('manageCollaborators', $ticket);

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $userId = (int) $request->user_id;
        $user = User::findOrFail($userId);

        // Hanya staff yang bisa jadi rekan
        if ($user->role !== 'staff') {
            return back()->withErrors(['user_id' => 'Hanya staff yang dapat ditambahkan sebagai rekan.']);
        }

        // Jangan tambah assignee sebagai rekan
        if ($ticket->assignee_id === $userId) {
            return back()->withErrors(['user_id' => 'Assignee sudah menjadi penanggung jawab utama.']);
        }

        if ($ticket->collaborators()->where('user_id', $userId)->exists()) {
            return back()->withErrors(['user_id' => 'User sudah ditambahkan sebagai rekan.']);
        }

        $ticket->collaborators()->create([
            'user_id' => $userId,
            'added_by' => auth()->id(),
        ]);

        $ticket->logActivity(
            TicketActivity::ACTION_COLLABORATOR_ADDED,
            null,
            $user->name,
            "Rekan {$user->name} ditambahkan",
            auth()->id()
        );

        return back()->with('success', "Rekan {$user->name} berhasil ditambahkan.");
    }

    /**
     * Remove a collaborator from the ticket.
     */
    public function destroy(Ticket $ticket, TicketCollaborator $collaborator): RedirectResponse
    {
        $this->authorize('manageCollaborators', $ticket);

        if ($collaborator->ticket_id !== $ticket->id) {
            abort(404);
        }

        $userName = $collaborator->user->name ?? 'Rekan';
        $collaborator->delete();

        $ticket->logActivity(
            TicketActivity::ACTION_COLLABORATOR_REMOVED,
            $userName,
            null,
            "Rekan {$userName} dihapus",
            auth()->id()
        );

        return back()->with('success', "Rekan {$userName} berhasil dihapus.");
    }
}
