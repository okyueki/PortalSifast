<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        // API request di-authenticate via Sanctum token di middleware
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nik' => ['required', 'string', 'max:50'],
            'ticket_type_id' => ['required', 'integer', Rule::exists('ticket_types', 'id')->where('is_active', true)],
            'ticket_category_id' => ['nullable', 'integer', Rule::exists('ticket_categories', 'id')->where('is_active', true)],
            'ticket_subcategory_id' => ['nullable', 'integer', Rule::exists('ticket_subcategories', 'id')->where('is_active', true)],
            'ticket_priority_id' => ['required', 'integer', Rule::exists('ticket_priorities', 'id')->where('is_active', true)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'related_ticket_id' => ['nullable', 'integer', Rule::exists('tickets', 'id')],
            'asset_no_inventaris' => ['nullable', 'string', 'max:50'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', Rule::exists('ticket_tags', 'id')->where('is_active', true)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nik.required' => 'NIK wajib diisi.',
            'ticket_type_id.required' => 'Tipe tiket harus dipilih.',
            'ticket_type_id.exists' => 'Tipe tiket tidak valid.',
            'ticket_category_id.exists' => 'Kategori tiket tidak valid.',
            'ticket_subcategory_id.exists' => 'Sub-kategori tiket tidak valid.',
            'ticket_priority_id.required' => 'Prioritas tiket harus dipilih.',
            'ticket_priority_id.exists' => 'Prioritas tiket tidak valid.',
            'title.required' => 'Judul tiket harus diisi.',
            'title.max' => 'Judul tiket maksimal 255 karakter.',
            'description.max' => 'Deskripsi tiket maksimal 10.000 karakter.',
        ];
    }
}
