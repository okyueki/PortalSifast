<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Services\AiRecommendationService;
use Illuminate\Http\JsonResponse;

class TicketRecommendationController extends Controller
{
    public function __construct(
        private AiRecommendationService $recommendationService,
    ) {}

    /**
     * GET /tickets/{ticket}/recommendation
     * Returns AI recommendation for how to handle this ticket.
     */
    public function __invoke(Ticket $ticket): JsonResponse
    {
        $recommendation = $this->recommendationService->generate($ticket);

        return response()->json([
            'success' => true,
            'recommendation' => $recommendation,
        ]);
    }
}
