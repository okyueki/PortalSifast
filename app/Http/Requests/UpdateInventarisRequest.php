<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventarisRequest extends FormRequest
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
            'kode_barang' => ['sometimes', 'required', 'string', 'max:50', Rule::exists('inventaris_barang', 'kode_barang')->connection('dbsimrs')],
            'asal_barang' => ['sometimes', 'nullable', 'string', 'max:100'],
            'tgl_pengadaan' => ['sometimes', 'nullable', 'date'],
            'harga' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status_barang' => ['sometimes', 'nullable', 'string', 'max:50'],
            'id_ruang' => ['sometimes', 'nullable', 'string', Rule::exists('inventaris_ruang', 'id_ruang')->connection('dbsimrs')],
            'no_rak' => ['sometimes', 'nullable', 'string', 'max:50'],
            'no_box' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_barang.required' => 'Kode barang harus dipilih.',
            'kode_barang.exists' => 'Kode barang tidak valid.',
            'id_ruang.exists' => 'Ruang tidak valid.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
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
