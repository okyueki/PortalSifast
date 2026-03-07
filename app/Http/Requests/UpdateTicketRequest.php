<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $ticket = $this->route('ticket');

        // Admin bisa update semua tiket
        if ($user->isAdmin()) {
            return true;
        }

        // Staff bisa update tiket di departemennya atau yang ditugaskan ke dia
        if ($user->isStaff()) {
            return $ticket->dep_id === $user->dep_id
                || $ticket->assignee_id === $user->id
                || $ticket->group?->members()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ticket_status_id' => ['sometimes', 'integer', Rule::exists('ticket_statuses', 'id')->where('is_active', true)],
            'ticket_priority_id' => ['sometimes', 'integer', Rule::exists('ticket_priorities', 'id')->where('is_active', true)],
            'assignee_id' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->where('role', 'staff')],
            'ticket_group_id' => ['sometimes', 'nullable', 'integer', Rule::exists('ticket_groups', 'id')],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'due_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'asset_no_inventaris' => ['sometimes', 'nullable', 'string', 'max:50'],
            'tag_ids' => ['sometimes', 'nullable', 'array'],
            'tag_ids.*' => ['integer', Rule::exists('ticket_tags', 'id')->where('is_active', true)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ticket_status_id.exists' => 'Status tiket tidak valid.',
            'ticket_priority_id.exists' => 'Prioritas tiket tidak valid.',
            'assignee_id.exists' => 'User yang ditugaskan tidak valid atau bukan staff.',
            'title.max' => 'Judul tiket maksimal 255 karakter.',
            'description.max' => 'Deskripsi tiket maksimal 10.000 karakter.',
            'due_date.date' => 'Format tanggal target tidak valid.',
            'due_date.after_or_equal' => 'Tanggal target tidak boleh di masa lalu.',
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
            'ticket_status_id' => 'status tiket',
            'ticket_priority_id' => 'prioritas tiket',
            'assignee_id' => 'petugas',
            'title' => 'judul',
            'description' => 'deskripsi',
            'due_date' => 'tanggal target',
        ];
    }
}
