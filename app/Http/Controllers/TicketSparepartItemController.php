<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketSparepartItemRequest;
use App\Http\Requests\UpdateTicketSparepartItemRequest;
use App\Models\Ticket;
use App\Models\TicketSparepartItem;
use Illuminate\Http\RedirectResponse;

class TicketSparepartItemController extends Controller
{
    public function store(StoreTicketSparepartItemRequest $request, Ticket $ticket): RedirectResponse
    {
        $ticket->sparepartItems()->create($request->validated());

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Item spare part berhasil ditambahkan.');
    }

    public function update(UpdateTicketSparepartItemRequest $request, Ticket $ticket, TicketSparepartItem $sparepartItem): RedirectResponse
    {
        if ($sparepartItem->ticket_id !== $ticket->id) {
            abort(404);
        }

        $sparepartItem->update($request->validated());

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Item spare part berhasil diubah.');
    }

    public function destroy(Ticket $ticket, TicketSparepartItem $sparepartItem): RedirectResponse
    {
        $this->authorize('manageVendorCosts', $ticket);

        if ($sparepartItem->ticket_id !== $ticket->id) {
            abort(404);
        }

        $sparepartItem->delete();

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Item spare part berhasil dihapus.');
    }
}
