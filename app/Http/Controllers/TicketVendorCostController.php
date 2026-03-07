<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketVendorCostRequest;
use App\Http\Requests\UpdateTicketVendorCostRequest;
use App\Models\Ticket;
use App\Models\TicketVendorCost;
use Illuminate\Http\RedirectResponse;

class TicketVendorCostController extends Controller
{
    /**
     * Store a new vendor cost record.
     */
    public function store(StoreTicketVendorCostRequest $request, Ticket $ticket): RedirectResponse
    {
        $data = collect($request->validated())
            ->map(fn ($v) => $v === '' ? null : $v)
            ->all();

        $ticket->vendorCosts()->create($data);

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Biaya vendor berhasil ditambahkan.');
    }

    /**
     * Update the specified vendor cost.
     */
    public function update(UpdateTicketVendorCostRequest $request, Ticket $ticket, TicketVendorCost $vendorCost): RedirectResponse
    {
        if ($vendorCost->ticket_id !== $ticket->id) {
            abort(404);
        }

        $vendorCost->update($request->validated());

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Biaya vendor berhasil diubah.');
    }

    /**
     * Remove the specified vendor cost.
     */
    public function destroy(Ticket $ticket, TicketVendorCost $vendorCost): RedirectResponse
    {
        $this->authorize('manageVendorCosts', $ticket);

        if ($vendorCost->ticket_id !== $ticket->id) {
            abort(404);
        }

        $vendorCost->delete();

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Biaya vendor berhasil dihapus.');
    }
}
