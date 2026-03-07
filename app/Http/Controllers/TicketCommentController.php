<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketCommentRequest;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketComment;
use App\Notifications\TicketCommentNotification;
use Illuminate\Http\RedirectResponse;

class TicketCommentController extends Controller
{
    /**
     * Store a newly created comment.
     */
    public function store(StoreTicketCommentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('comment', $ticket);

        $user = $request->user();
        $validated = $request->validated();

        $comment = $ticket->comments()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        // Log activity
        $ticket->logActivity(
            TicketActivity::ACTION_COMMENTED,
            null,
            $comment->is_internal ? 'Internal comment' : 'Public comment',
            'Menambahkan komentar'
        );

        // Notify requester & assignee (skip internal comments, skip comment author)
        if (! $comment->is_internal) {
            $toNotify = collect([$ticket->requester, $ticket->assignee])
                ->filter()
                ->unique('id')
                ->reject(fn ($u) => $u->id === $user->id);

            foreach ($toNotify as $recipient) {
                $recipient->notify(new TicketCommentNotification($ticket, $comment));
            }
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Komentar berhasil ditambahkan.');
    }

    /**
     * Remove the specified comment.
     */
    public function destroy(Ticket $ticket, TicketComment $comment): RedirectResponse
    {
        $user = request()->user();

        // Hanya pemilik komentar atau admin yang bisa hapus
        if ($comment->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'Anda tidak memiliki akses untuk menghapus komentar ini.');
        }

        $comment->delete();

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Komentar berhasil dihapus.');
    }
}
