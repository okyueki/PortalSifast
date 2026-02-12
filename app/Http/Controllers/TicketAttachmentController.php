<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketAttachmentRequest;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    /**
     * Store a newly created attachment.
     */
    public function store(StoreTicketAttachmentRequest $request, Ticket $ticket): RedirectResponse
    {
        $file = $request->file('file');

        $path = $file->store("tickets/{$ticket->id}", 'public');

        $attachment = $ticket->attachments()->create([
            'user_id' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

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
