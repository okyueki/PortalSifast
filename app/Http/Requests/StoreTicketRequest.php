<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Semua user yang login bisa membuat tiket
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
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
            'created_at' => ['nullable', 'date'],
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'is_draft' => ['nullable', 'boolean'],
            'plan_ideas' => ['nullable', 'string', 'max:10000'],
            'plan_tools' => ['nullable', 'string', 'max:10000'],
            'budget_estimate' => ['nullable', 'integer', 'min:0'],
            'budget_notes' => ['nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => [
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,jfif,png,gif,webp,zip',
            ],
        ];

        // Admin dan staff (teknisi) dapat memilih pemohon secara manual
        if ($this->user()?->isAdmin() || $this->user()?->isStaff()) {
            $rules['requester_id'] = ['nullable', 'integer', Rule::exists('users', 'id')];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ticket_type_id.required' => 'Tipe tiket harus dipilih.',
            'ticket_type_id.exists' => 'Tipe tiket tidak valid.',
            'ticket_category_id.exists' => 'Kategori tiket tidak valid.',
            'ticket_subcategory_id.exists' => 'Sub-kategori tiket tidak valid.',
            'ticket_priority_id.required' => 'Prioritas tiket harus dipilih.',
            'ticket_priority_id.exists' => 'Prioritas tiket tidak valid.',
            'title.required' => 'Judul tiket harus diisi.',
            'title.max' => 'Judul tiket maksimal 255 karakter.',
            'description.max' => 'Deskripsi tiket maksimal 10.000 karakter.',
            'attachments.max' => 'Maksimal 10 file lampiran per tiket.',
            'attachments.*.max' => 'Ukuran tiap file maksimal 10 MB.',
            'attachments.*.mimes' => 'Format lampiran: pdf, doc, docx, xls, xlsx, jpg, jpeg, jfif, png, gif, webp, zip.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'ticket_type_id' => 'tipe tiket',
            'ticket_category_id' => 'kategori tiket',
            'ticket_subcategory_id' => 'sub-kategori tiket',
            'ticket_priority_id' => 'prioritas tiket',
            'title' => 'judul',
            'description' => 'deskripsi',
            'created_at' => 'tanggal & waktu lapor',
            'attachments' => 'lampiran',
            'attachments.*' => 'file lampiran',
        ];
    }
}
