<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Services\AiDocumentationService;
use Illuminate\Http\JsonResponse;

/**
 * Generates work documentation via AI (OpenRouter/deepseek).
 * Falls back to template if no API key configured.
 */
class TicketDocumentationController extends Controller
{
    public function __construct(
        private AiDocumentationService $aiService,
    ) {}

    public function __invoke(Ticket $ticket): JsonResponse
    {
        $documentation = $this->aiService->generate($ticket);

        return response()->json([
            'success' => true,
            'documentation' => $documentation,
        ]);
    }
}
