<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Requests\StoreMessageRequest;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Conversation::class);

        $conversations = $request->user()
            ->conversations()
            ->with(['participants', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderByPivot('updated_at', 'desc')
            ->get()
            ->map(function (Conversation $c) use ($request) {
                $lastMessage = $c->messages->first();
                $other = $c->otherParticipant($request->user());

                return [
                    'id' => $c->id,
                    'display_name' => $c->displayNameFor($request->user()),
                    'other_participant' => $other ? [
                        'id' => $other->id,
                        'name' => $other->name,
                    ] : null,
                    'last_message' => $lastMessage ? [
                        'body' => \Illuminate\Support\Str::limit($lastMessage->body, 50),
                        'created_at' => $lastMessage->created_at->toIso8601String(),
                        'is_mine' => $lastMessage->user_id === $request->user()->id,
                    ] : null,
                    'updated_at' => $c->updated_at->toIso8601String(),
                ];
            });

        return Inertia::render('chat/index', [
            'conversations' => $conversations,
            'users' => User::query()
                ->where('id', '!=', $request->user()->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email]),
        ]);
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $this->authorize('view', $conversation);

        $conversation->load('participants');
        $messages = $conversation->messages()->with('user:id,name')->oldest()->get();
        $other = $conversation->otherParticipant($request->user());

        return Inertia::render('chat/show', [
            'conversation' => [
                'id' => $conversation->id,
                'display_name' => $conversation->displayNameFor($request->user()),
                'other_participant' => $other ? ['id' => $other->id, 'name' => $other->name] : null,
            ],
            'messages' => $messages->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'user_id' => $m->user_id,
                'user_name' => $m->user->name,
                'created_at' => $m->created_at->toIso8601String(),
                'is_mine' => $m->user_id === $request->user()->id,
            ])->values()->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Conversation::class);

        $request->validate(['user_id' => ['required', 'integer', 'exists:users,id', 'not_in:'.$request->user()->id]]);
        $other = User::findOrFail($request->input('user_id'));
        $conversation = Conversation::firstOrCreateBetween($request->user(), $other);

        return redirect()->route('chat.show', $conversation);
    }

    public function storeMessage(StoreMessageRequest $request, Conversation $conversation): RedirectResponse
    {
        $this->authorize('view', $conversation);

        $message = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);
        $message->load('user:id,name');
        foreach ($conversation->participants()->pluck('user_id') as $userId) {
            $conversation->participants()->updateExistingPivot($userId, ['updated_at' => now()]);
        }
        broadcast(new MessageSent($message))->toOthers();

        return redirect()->route('chat.show', $conversation);
    }
}
