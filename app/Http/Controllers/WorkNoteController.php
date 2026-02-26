<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkNoteRequest;
use App\Http\Requests\UpdateWorkNoteRequest;
use App\Models\WorkNote;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkNoteController extends Controller
{
    /**
     * @return array{notes: array<int, array<string, mixed>>, selectedNote: array<string, mixed>|null}
     */
    private function catatanPageProps(Request $request, ?WorkNote $selectedNote = null): array
    {
        $notes = $request->user()
            ->workNotes()
            ->orderByDesc('updated_at')
            ->get();

        if ($selectedNote === null && $notes->isNotEmpty()) {
            $selectedNote = $notes->first();
        }

        return [
            'notes' => $notes->map(fn (WorkNote $n) => [
                'id' => (string) $n->id,
                'title' => $n->title,
                'icon' => $n->icon ?? '📄',
                'blocks' => $n->content ?? [],
                'createdAt' => $n->created_at->toIso8601String(),
                'updatedAt' => $n->updated_at->toIso8601String(),
            ])->values()->all(),
            'selectedNote' => $selectedNote ? [
                'id' => (string) $selectedNote->id,
                'title' => $selectedNote->title,
                'icon' => $selectedNote->icon ?? '📄',
                'blocks' => $selectedNote->content ?? [],
                'createdAt' => $selectedNote->created_at->toIso8601String(),
                'updatedAt' => $selectedNote->updated_at->toIso8601String(),
            ] : null,
        ];
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', WorkNote::class);

        $notes = $request->user()
            ->workNotes()
            ->orderByDesc('updated_at')
            ->get();

        $selectedNote = null;
        $selectedId = $request->query('note');
        if ($selectedId && is_numeric($selectedId)) {
            $selectedNote = $notes->firstWhere('id', (int) $selectedId);
            if ($selectedNote === null) {
                $note = WorkNote::find((int) $selectedId);
                if ($note && $request->user()->can('view', $note)) {
                    $selectedNote = $note;
                }
            }
        }

        return Inertia::render('catatan/index', $this->catatanPageProps($request, $selectedNote));
    }

    public function store(StoreWorkNoteRequest $request): Response
    {
        $this->authorize('create', WorkNote::class);

        $blocks = $request->input('content');
        if (! is_array($blocks) || $blocks === []) {
            $blocks = [
                ['id' => (string) (time().'-1'), 'type' => 'h1', 'content' => 'Catatan Baru'],
                ['id' => (string) (time().'-2'), 'type' => 'text', 'content' => ''],
            ];
        }

        $note = $request->user()->workNotes()->create([
            'title' => $request->input('title', 'Catatan Baru'),
            'icon' => $request->input('icon', '📄'),
            'content' => $blocks,
        ]);

        return Inertia::render('catatan/index', $this->catatanPageProps($request, $note->fresh()));
    }

    public function update(UpdateWorkNoteRequest $request, WorkNote $workNote): Response
    {
        $this->authorize('update', $workNote);

        $data = array_filter([
            'title' => $request->input('title'),
            'icon' => $request->input('icon'),
            'content' => $request->input('content'),
        ], fn ($v) => $v !== null);

        $workNote->update($data);

        return Inertia::render('catatan/index', $this->catatanPageProps($request, $workNote->fresh()));
    }

    public function destroy(WorkNote $workNote): Response
    {
        $this->authorize('delete', $workNote);

        $workNote->delete();

        return Inertia::render('catatan/index', $this->catatanPageProps(request()));
    }
}
