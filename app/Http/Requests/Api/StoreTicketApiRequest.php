<?php

namespace App\Http\Requests\Api;

use App\Models\TicketPriority;
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
     * Prepare the data for validation - handle field aliases from frontend.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];

        // Alias: judul -> title
        if ($this->has('judul') && ! $this->has('title')) {
            $merge['title'] = $this->input('judul');
        }

        // Alias: deskripsi -> description
        if ($this->has('deskripsi') && ! $this->has('description')) {
            $merge['description'] = $this->input('deskripsi');
        }

        // Alias: kategori_id -> ticket_category_id
        if ($this->has('kategori_id') && ! $this->has('ticket_category_id')) {
            $merge['ticket_category_id'] = $this->input('kategori_id');
        }

        // Alias: tipe_id -> ticket_type_id
        if ($this->has('tipe_id') && ! $this->has('ticket_type_id')) {
            $merge['ticket_type_id'] = $this->input('tipe_id');
        }

        // Alias: prioritas (string like 'sedang', 'tinggi') -> ticket_priority_id
        if ($this->has('prioritas') && ! $this->has('ticket_priority_id')) {
            $prioritas = strtolower($this->input('prioritas'));
            $priorityId = $this->resolvePriorityId($prioritas);
            if ($priorityId) {
                $merge['ticket_priority_id'] = $priorityId;
            }
        }

        // Alias: prioritas_id -> ticket_priority_id
        if ($this->has('prioritas_id') && ! $this->has('ticket_priority_id')) {
            $merge['ticket_priority_id'] = $this->input('prioritas_id');
        }

        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    /**
     * Resolve priority string to ID.
     */
    private function resolvePriorityId(string $prioritas): ?int
    {
        $map = [
            'kritis' => 1,
            'p1' => 1,
            'tinggi' => 2,
            'p2' => 2,
            'sedang' => 3,
            'p3' => 3,
            'rendah' => 4,
            'p4' => 4,
        ];

        if (isset($map[$prioritas])) {
            return $map[$prioritas];
        }

        // Try to find by name
        $priority = TicketPriority::where('name', 'like', "%{$prioritas}%")->first();

        return $priority?->id;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nik' => ['required', 'string', 'max:50'],
            'ticket_type_id' => ['nullable', 'integer', Rule::exists('ticket_types', 'id')->where('is_active', true)],
            'ticket_category_id' => ['nullable', 'integer', Rule::exists('ticket_categories', 'id')->where('is_active', true)],
            'ticket_subcategory_id' => ['nullable', 'integer', Rule::exists('ticket_subcategories', 'id')->where('is_active', true)],
            'ticket_priority_id' => ['nullable', 'integer', Rule::exists('ticket_priorities', 'id')->where('is_active', true)],
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
            'ticket_type_id.exists' => 'Tipe tiket tidak valid.',
            'ticket_category_id.exists' => 'Kategori tiket tidak valid.',
            'ticket_subcategory_id.exists' => 'Sub-kategori tiket tidak valid.',
            'ticket_priority_id.exists' => 'Prioritas tiket tidak valid.',
            'title.required' => 'Judul tiket harus diisi.',
            'title.max' => 'Judul tiket maksimal 255 karakter.',
            'description.max' => 'Deskripsi tiket maksimal 10.000 karakter.',
        ];
    }
}
