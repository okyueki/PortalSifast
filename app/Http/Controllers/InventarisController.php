<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventarisRequest;
use App\Http\Requests\UpdateInventarisRequest;
use App\Models\Inventaris;
use App\Models\InventarisBarang;
use App\Models\InventarisRuang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventarisController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->query('q', '');

        try {
            $query = Inventaris::query()
                ->with(['barang', 'ruang'])
                ->when($q, function ($query) use ($q) {
                    $search = "%{$q}%";
                    $query->where(function ($q2) use ($search) {
                        $q2->where('no_inventaris', 'like', $search)
                            ->orWhere('kode_barang', 'like', $search)
                            ->orWhereHas('barang', fn ($b) => $b->where('nama_barang', 'like', $search));
                    });
                })
                ->orderBy('no_inventaris');

            $inventaris = $query->paginate(20)
                ->withQueryString()
                ->through(fn (Inventaris $inv) => [
                    'no_inventaris' => $inv->no_inventaris,
                    'kode_barang' => $inv->kode_barang,
                    'nama_barang' => $inv->barang?->nama_barang ?? $inv->kode_barang,
                    'nama_ruang' => $inv->ruang?->nama_ruang ?? null,
                    'status_barang' => $inv->status_barang ?? null,
                ]);
        } catch (\Throwable $e) {
            $inventaris = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20, 1);
        }

        return Inertia::render('inventaris/index', [
            'inventaris' => $inventaris,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        try {
            $barang = InventarisBarang::query()
                ->orderBy('nama_barang')
                ->limit(500)
                ->get(['kode_barang', 'nama_barang'])
                ->map(fn ($b) => ['kode_barang' => $b->kode_barang, 'nama_barang' => $b->nama_barang]);

            $ruang = InventarisRuang::query()
                ->orderBy('nama_ruang')
                ->get(['id_ruang', 'nama_ruang']);
        } catch (\Throwable $e) {
            $barang = collect();
            $ruang = collect();
        }

        return Inertia::render('inventaris/create', [
            'barang' => $barang,
            'ruang' => $ruang,
        ]);
    }

    public function store(StoreInventarisRequest $request): RedirectResponse
    {
        $v = $request->validated();

        Inventaris::query()->create([
            'no_inventaris' => $v['no_inventaris'],
            'kode_barang' => $v['kode_barang'],
            'asal_barang' => $v['asal_barang'] ?? null,
            'tgl_pengadaan' => isset($v['tgl_pengadaan']) ? $v['tgl_pengadaan'] : null,
            'harga' => $v['harga'] ?? null,
            'status_barang' => $v['status_barang'] ?? null,
            'id_ruang' => $v['id_ruang'] ?? null,
            'no_rak' => $v['no_rak'] ?? null,
            'no_box' => $v['no_box'] ?? null,
        ]);

        return redirect()
            ->route('inventaris.index')
            ->with('success', 'Inventaris berhasil ditambahkan.');
    }

    public function show(Inventaris $inventaris): Response
    {
        $inventaris->load(['barang', 'ruang']);

        return Inertia::render('inventaris/show', [
            'inventaris' => [
                'no_inventaris' => $inventaris->no_inventaris,
                'kode_barang' => $inventaris->kode_barang,
                'nama_barang' => $inventaris->barang?->nama_barang ?? $inventaris->kode_barang,
                'asal_barang' => $inventaris->asal_barang,
                'tgl_pengadaan' => $inventaris->tgl_pengadaan,
                'harga' => $inventaris->harga,
                'status_barang' => $inventaris->status_barang,
                'nama_ruang' => $inventaris->ruang?->nama_ruang ?? null,
                'no_rak' => $inventaris->no_rak,
                'no_box' => $inventaris->no_box,
            ],
        ]);
    }

    public function edit(Inventaris $inventaris): Response
    {
        $inventaris->load(['barang', 'ruang']);

        try {
            $barang = InventarisBarang::query()
                ->orderBy('nama_barang')
                ->limit(500)
                ->get(['kode_barang', 'nama_barang'])
                ->map(fn ($b) => ['kode_barang' => $b->kode_barang, 'nama_barang' => $b->nama_barang]);

            $ruang = InventarisRuang::query()
                ->orderBy('nama_ruang')
                ->get(['id_ruang', 'nama_ruang']);
        } catch (\Throwable $e) {
            $barang = collect();
            $ruang = collect();
        }

        return Inertia::render('inventaris/edit', [
            'inventaris' => [
                'no_inventaris' => $inventaris->no_inventaris,
                'kode_barang' => $inventaris->kode_barang,
                'nama_barang' => $inventaris->barang?->nama_barang ?? $inventaris->kode_barang,
                'asal_barang' => $inventaris->asal_barang,
                'tgl_pengadaan' => $inventaris->tgl_pengadaan,
                'harga' => $inventaris->harga,
                'status_barang' => $inventaris->status_barang,
                'id_ruang' => $inventaris->id_ruang,
                'nama_ruang' => $inventaris->ruang?->nama_ruang ?? null,
                'no_rak' => $inventaris->no_rak,
                'no_box' => $inventaris->no_box,
            ],
            'barang' => $barang,
            'ruang' => $ruang,
        ]);
    }

    public function update(UpdateInventarisRequest $request, Inventaris $inventaris): RedirectResponse
    {
        $inventaris->update($request->validated());

        return redirect()
            ->route('inventaris.show', $inventaris)
            ->with('success', 'Inventaris berhasil diperbarui.');
    }

    public function destroy(Inventaris $inventaris): RedirectResponse
    {
        $inventaris->delete();

        return redirect()
            ->route('inventaris.index')
            ->with('success', 'Inventaris berhasil dihapus.');
    }
}
