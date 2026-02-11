<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PegawaiController extends Controller
{
    public function index(Request $request): Response
    {
        $pegawai = Pegawai::query()
            ->with(['dokter', 'petugas'])
            ->where('stts_aktif', 'AKTIF')
            ->orderBy('nama')
            ->paginate(20)
            ->withQueryString()
            ->through(function (Pegawai $p) {
                $type = $p->dokter ? 'Dokter' : ($p->petugas ? 'Petugas' : 'Lainnya');

                return [
                    'nik' => $p->nik,
                    'nama' => $p->nama,
                    'jk' => $p->jk,
                    'jbtn' => $p->jbtn,
                    'departemen' => $p->departemen,
                    'type' => $type,
                ];
            });

        return Inertia::render('pegawai/index', [
            'pegawai' => $pegawai,
        ]);
    }
}
