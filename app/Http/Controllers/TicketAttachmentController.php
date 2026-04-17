<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketAttachmentRequest;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketAttachment;
use App\Services\TicketAttachmentStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    /**
     * Store a newly created attachment.
     */
    public function store(StoreTicketAttachmentRequest $request, Ticket $ticket): RedirectResponse
    {
        try {
            $attachment = TicketAttachmentStorageService::storeOnTicket(
                $request->file('file'),
                $ticket,
                $request->user()
            );
        } catch (\RuntimeException $e) {
            return redirect()
                ->route('tickets.show', $ticket)
                ->with('error', $e->getMessage());
        }

        $ticket->logActivity(
            TicketActivity::ACTION_ATTACHMENT_ADDED,
            null,
            $attachment->filename,
            'Menambahkan lampiran'
        );

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Lampiran berhasil diunggah.');
    }

    /**
     * Remove the specified attachment.
     */
    public function destroy(Ticket $ticket, TicketAttachment $attachment): RedirectResponse
    {
        $this->authorize('attach', $ticket);

        if ($attachment->ticket_id !== $ticket->id) {
            abort(404);
        }

        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Lampiran berhasil dihapus.');
    }
}
