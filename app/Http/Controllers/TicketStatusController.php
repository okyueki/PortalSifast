<?php

namespace App\Http\Controllers;

use App\Models\TicketStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketStatusController extends Controller
{
    /**
     * Daftar status tiket (integrasi dari data tiket yang ada).
     */
    public function index(Request $request): Response
    {
        $statuses = TicketStatus::query()
            ->withCount('tickets')
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return Inertia::render('tickets/statuses/index', [
            'statuses' => $statuses,
        ]);
    }
}
