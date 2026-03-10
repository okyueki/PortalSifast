<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);

        $q = $request->string('q')->trim();
        $status = $request->string('status')->toString() ?: null;

        $query = Project::query()
            ->withCount('tickets')
            ->with('createdBy:id,name')
            ->orderBy('updated_at', 'desc');

        if ($q !== '') {
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', '%'.$q.'%')
                    ->orWhere('description', 'like', '%'.$q.'%');
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $projects = $query->paginate(15)->withQueryString();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => ['q' => $q, 'status' => $status],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('projects/create', [
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->authorize('create', Project::class);

        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;
        $validated['status'] = $validated['status'] ?? Project::STATUS_PLANNING;

        $project = Project::create($validated);

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Rencana/proyek berhasil dibuat.');
    }

    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load(['createdBy:id,name', 'tickets' => function ($q) {
            $q->with(['type', 'category', 'status', 'priority', 'requester:id,name', 'assignee:id,name'])
                ->orderBy('created_at', 'desc');
        }]);

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('projects/edit', [
            'project' => $project,
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validated();
        $validated['status'] = $validated['status'] ?? $project->status;

        $project->update($validated);

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Rencana/proyek berhasil diperbarui.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        $project->tickets()->update(['project_id' => null]);
        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Rencana/proyek berhasil dihapus.');
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => Project::STATUS_PLANNING, 'label' => 'Perencanaan'],
            ['value' => Project::STATUS_IN_PROGRESS, 'label' => 'Sedang Berjalan'],
            ['value' => Project::STATUS_COMPLETED, 'label' => 'Selesai'],
            ['value' => Project::STATUS_ON_HOLD, 'label' => 'Ditunda'],
        ];
    }
}
