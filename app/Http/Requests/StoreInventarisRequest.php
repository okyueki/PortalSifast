<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventarisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'no_inventaris' => ['required', 'string', 'max:30', 'unique:dbsimrs.inventaris,no_inventaris'],
            'kode_barang' => ['required', 'string', 'max:20', 'exists:dbsimrs.inventaris_barang,kode_barang'],
            'asal_barang' => ['nullable', 'string', 'in:Beli,Bantuan,Hibah'],
            'tgl_pengadaan' => ['nullable', 'date'],
            'harga' => ['nullable', 'numeric', 'min:0'],
            'status_barang' => ['nullable', 'string', 'in:Ada,Rusak,Hilang,Perbaikan,Dipinjam'],
            'id_ruang' => ['nullable', 'string', 'max:5', 'exists:dbsimrs.inventaris_ruang,id_ruang'],
            'no_rak' => ['nullable', 'string', 'max:3'],
            'no_box' => ['nullable', 'string', 'max:3'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'no_inventaris.required' => 'No inventaris harus diisi.',
            'no_inventaris.unique' => 'No inventaris sudah digunakan.',
            'kode_barang.required' => 'Kode barang harus dipilih.',
            'kode_barang.exists' => 'Kode barang tidak valid.',
            'asal_barang.in' => 'Asal barang harus salah satu dari: Beli, Bantuan, atau Hibah',
            'status_barang.in' => 'Status barang harus salah satu dari: Ada, Rusak, Hilang, Perbaikan, atau Dipinjam',
            'id_ruang.exists' => 'Ruang tidak valid.',
            'no_rak.max' => 'No rak maksimal 3 karakter.',
            'no_box.max' => 'No box maksimal 3 karakter.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'no_inventaris' => 'no inventaris',
            'kode_barang' => 'kode barang',
            'asal_barang' => 'asal barang',
            'tgl_pengadaan' => 'tanggal pengadaan',
            'harga' => 'harga',
            'status_barang' => 'status barang',
            'id_ruang' => 'ruang',
            'no_rak' => 'no rak',
            'no_box' => 'no box',
        ];
    }
}
