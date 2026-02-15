<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventarisBarangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kode_barang' => 'required|string|max:50|unique:inventaris_barang,kode_barang',
            'nama_barang' => 'required|string|max:255',
            'jml_barang' => 'nullable|integer|min:0',
            'kode_produsen' => 'nullable|string|max:50|exists:inventaris_produsen,kode_produsen',
            'id_merk' => 'nullable|integer|exists:inventaris_merk,id_merk',
            'thn_produksi' => 'nullable|integer|min:1900|max:' . (date('Y') + 10),
            'isbn' => 'nullable|string|max:20',
            'id_kategori' => 'nullable|integer|exists:inventaris_kategori,id_kategori',
            'id_jenis' => 'nullable|integer|exists:inventaris_jenis,id_jenis',
        ];
    }

    public function messages(): array
    {
        return [
            'kode_barang.required' => 'Kode barang wajib diisi.',
            'kode_barang.unique' => 'Kode barang sudah digunakan.',
            'nama_barang.required' => 'Nama barang wajib diisi.',
            'jml_barang.integer' => 'Jumlah barang harus berupa angka.',
            'jml_barang.min' => 'Jumlah barang tidak boleh negatif.',
            'thn_produksi.integer' => 'Tahun produksi harus berupa angka.',
            'thn_produksi.min' => 'Tahun produksi tidak valid.',
            'thn_produksi.max' => 'Tahun produksi tidak valid.',
            'kode_produsen.exists' => 'Produsen tidak ditemukan.',
            'id_merk.exists' => 'Merk tidak ditemukan.',
            'id_kategori.exists' => 'Kategori tidak ditemukan.',
            'id_jenis.exists' => 'Jenis tidak ditemukan.',
        ];
    }
}
