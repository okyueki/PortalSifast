<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Departemen;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketSettingsController extends Controller
{
    /**
     * Display the ticket settings page (all master data).
     */
    public function index(): Response
    {
        return Inertia::render('settings/tickets/index', [
            'types' => TicketType::orderBy('name')->get(),
            'categories' => TicketCategory::with('type', 'subcategories')
                ->orderBy('name')
                ->get(),
            'priorities' => TicketPriority::orderBy('level')->get(),
            'statuses' => TicketStatus::orderBy('order')->get(),
            'departments' => Departemen::orderBy('nama')->get(['dep_id', 'nama']),
        ]);
    }

    // ============== TYPES ==============

    public function storeType(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        TicketType::create($validated);

        return back()->with('success', 'Tipe tiket berhasil ditambahkan.');
    }

    public function updateType(Request $request, TicketType $type): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $type->update($validated);

        return back()->with('success', 'Tipe tiket berhasil diperbarui.');
    }

    public function destroyType(TicketType $type): RedirectResponse
    {
        if ($type->tickets()->exists()) {
            return back()->with('error', 'Tipe tiket tidak bisa dihapus karena masih digunakan.');
        }

        $type->delete();

        return back()->with('success', 'Tipe tiket berhasil dihapus.');
    }

    // ============== CATEGORIES ==============

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ticket_type_id' => 'required|exists:ticket_types,id',
            'dep_id' => 'required|exists:departemen,dep_id',
            'is_development' => 'boolean',
        ]);

        TicketCategory::create($validated);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function updateCategory(Request $request, TicketCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ticket_type_id' => 'required|exists:ticket_types,id',
            'dep_id' => 'required|exists:departemen,dep_id',
            'is_development' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroyCategory(TicketCategory $category): RedirectResponse
    {
        if ($category->tickets()->exists()) {
            return back()->with('error', 'Kategori tidak bisa dihapus karena masih digunakan.');
        }

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    // ============== PRIORITIES ==============

    public function storePriority(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'level' => 'required|integer|min:1',
            'color' => 'required|string|max:50',
            'response_hours' => 'nullable|integer|min:0',
            'resolution_hours' => 'nullable|integer|min:0',
        ]);

        TicketPriority::create($validated);

        return back()->with('success', 'Prioritas berhasil ditambahkan.');
    }

    public function updatePriority(Request $request, TicketPriority $priority): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'level' => 'required|integer|min:1',
            'color' => 'required|string|max:50',
            'response_hours' => 'nullable|integer|min:0',
            'resolution_hours' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $priority->update($validated);

        return back()->with('success', 'Prioritas berhasil diperbarui.');
    }

    public function destroyPriority(TicketPriority $priority): RedirectResponse
    {
        if ($priority->tickets()->exists()) {
            return back()->with('error', 'Prioritas tidak bisa dihapus karena masih digunakan.');
        }

        $priority->delete();

        return back()->with('success', 'Prioritas berhasil dihapus.');
    }

    // ============== STATUSES ==============

    public function storeStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:50|unique:ticket_statuses,slug',
            'color' => 'required|string|max:50',
            'order' => 'required|integer|min:1',
            'is_closed' => 'boolean',
        ]);

        TicketStatus::create($validated);

        return back()->with('success', 'Status berhasil ditambahkan.');
    }

    public function updateStatus(Request $request, TicketStatus $status): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:50|unique:ticket_statuses,slug,'.$status->id,
            'color' => 'required|string|max:50',
            'order' => 'required|integer|min:1',
            'is_closed' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $status->update($validated);

        return back()->with('success', 'Status berhasil diperbarui.');
    }

    public function destroyStatus(TicketStatus $status): RedirectResponse
    {
        if ($status->tickets()->exists()) {
            return back()->with('error', 'Status tidak bisa dihapus karena masih digunakan.');
        }

        $status->delete();

        return back()->with('success', 'Status berhasil dihapus.');
    }
}
