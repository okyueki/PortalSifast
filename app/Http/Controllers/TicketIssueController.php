<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketIssueRequest;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketIssue;
use App\Models\TicketStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TicketIssueController extends Controller
{
    /**
     * Store a new issue on the ticket.
     */
    public function store(StoreTicketIssueRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);

        $user = $request->user();
        $validated = $request->validated();

        $issue = $ticket->issues()->create([
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => TicketIssue::STATUS_OPEN,
        ]);

        // Saat issue open: jika tiket belum closed dan status bukan pending → set ke Tertunda (pending)
        if (! $ticket->status->is_closed && $ticket->status->slug !== TicketStatus::SLUG_PENDING) {
            $pendingStatus = TicketStatus::where('slug', TicketStatus::SLUG_PENDING)->first();
            if ($pendingStatus) {
                $oldStatusName = $ticket->status->name ?? null;
                $ticket->ticket_status_id = $pendingStatus->id;
                $ticket->save();
                $ticket->logActivity(
                    TicketActivity::ACTION_STATUS_CHANGED,
                    $oldStatusName,
                    $pendingStatus->name,
                    'Status diubah ke Tertunda karena ada issue baru'
                );
            }
        }

        $ticket->logActivity(
            TicketActivity::ACTION_ISSUE_OPENED,
            null,
            $issue->title,
            'Issue ditambahkan: '.$issue->title
        );

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Issue berhasil ditambahkan.');
    }

    /**
     * Resolve an issue (staff/admin only).
     */
    public function resolve(Request $request, Ticket $ticket, TicketIssue $issue): RedirectResponse
    {
        $this->authorize('changeStatus', $ticket);

        if ($issue->ticket_id !== $ticket->id) {
            abort(404);
        }

        if ($issue->status === TicketIssue::STATUS_RESOLVED) {
            return redirect()
                ->route('tickets.show', $ticket)
                ->with('info', 'Issue sudah diselesaikan.');
        }

        $issue->status = TicketIssue::STATUS_RESOLVED;
        $issue->resolved_at = now();
        $issue->save();

        $ticket->logActivity(
            TicketActivity::ACTION_ISSUE_RESOLVED,
            $issue->title,
            null,
            'Issue diselesaikan: '.$issue->title
        );

        // Jika tidak ada lagi issue open → set tiket ke Dikerjakan (in_progress)
        $hasOpenIssues = $ticket->openIssues()->exists();
        if (! $hasOpenIssues) {
            $inProgressStatus = TicketStatus::where('slug', TicketStatus::SLUG_IN_PROGRESS)->first();
            if ($inProgressStatus && ! $ticket->status->is_closed) {
                $oldStatusName = $ticket->status->name ?? null;
                $ticket->ticket_status_id = $inProgressStatus->id;
                $ticket->save();
                $ticket->logActivity(
                    TicketActivity::ACTION_STATUS_CHANGED,
                    $oldStatusName,
                    $inProgressStatus->name,
                    'Semua issue selesai, status diubah ke Dikerjakan'
                );
            }
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Issue berhasil diselesaikan.');
    }
}
