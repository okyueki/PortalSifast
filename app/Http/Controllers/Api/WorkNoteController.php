<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkNoteRequest;
use App\Http\Requests\UpdateWorkNoteRequest;
use App\Models\WorkNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API Catatan Kerja (work notes).
 * Akses: hanya pembuat (user_id) dan admin.
 * Auth: Bearer Token (Sanctum).
 */
class WorkNoteController extends Controller
{
    private function toNoteArray(WorkNote $n): array
    {
        return [
            'id' => (string) $n->id,
            'user_id' => (string) $n->user_id,
            'title' => $n->title,
            'icon' => $n->icon ?? '📄',
            'content' => $n->content ?? [],
            'created_at' => $n->created_at->toIso8601String(),
            'updated_at' => $n->updated_at->toIso8601String(),
        ];
    }

    /**
     * Daftar catatan. Admin: semua; non-admin: hanya milik sendiri.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->can('viewAny', WorkNote::class)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = $user->isAdmin()
            ? WorkNote::query()->with('user:id,name,email')
            : $user->workNotes();

        $notes = $query->orderByDesc('updated_at')->get();

        $data = $notes->map(function (WorkNote $n) {
            $arr = $this->toNoteArray($n);
            if ($n->relationLoaded('user')) {
                $arr['user'] = [
                    'id' => $n->user->id,
                    'name' => $n->user->name,
                    'email' => $n->user->email,
                ];
            }

            return $arr;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Buat catatan baru (milik user yang login).
     */
    public function store(StoreWorkNoteRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->can('create', WorkNote::class)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $blocks = $request->input('content');
        if (! is_array($blocks) || $blocks === []) {
            $blocks = [
                ['id' => (string) (time().'-1'), 'type' => 'h1', 'content' => 'Catatan Baru'],
                ['id' => (string) (time().'-2'), 'type' => 'text', 'content' => ''],
            ];
        }

        $note = $user->workNotes()->create([
            'title' => $request->input('title', 'Catatan Baru'),
            'icon' => $request->input('icon', '📄'),
            'content' => $blocks,
        ]);

        return response()->json([
            'message' => 'Catatan dibuat.',
            'data' => $this->toNoteArray($note),
        ], 201);
    }

    /**
     * Detail satu catatan. Hanya pembuat atau admin.
     */
    public function show(Request $request, WorkNote $workNote): JsonResponse
    {
        if (! $request->user()->can('view', $workNote)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $workNote->load('user:id,name,email');
        $arr = $this->toNoteArray($workNote);
        $arr['user'] = [
            'id' => $workNote->user->id,
            'name' => $workNote->user->name,
            'email' => $workNote->user->email,
        ];

        return response()->json(['data' => $arr]);
    }

    /**
     * Update catatan. Hanya pembuat atau admin.
     */
    public function update(UpdateWorkNoteRequest $request, WorkNote $workNote): JsonResponse
    {
        if (! $request->user()->can('update', $workNote)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = array_filter([
            'title' => $request->input('title'),
            'icon' => $request->input('icon'),
            'content' => $request->input('content'),
        ], fn ($v) => $v !== null);

        $workNote->update($data);

        return response()->json([
            'message' => 'Catatan diperbarui.',
            'data' => $this->toNoteArray($workNote->fresh()),
        ]);
    }

    /**
     * Hapus catatan. Hanya pembuat atau admin.
     */
    public function destroy(Request $request, WorkNote $workNote): JsonResponse
    {
        if (! $request->user()->can('delete', $workNote)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $workNote->delete();

        return response()->json(['message' => 'Catatan dihapus.'], 200);
    }
}
