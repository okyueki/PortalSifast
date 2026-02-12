<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:10000'],
            'is_internal' => ['sometimes', 'boolean'],
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
            'body.required' => 'Isi komentar harus diisi.',
            'body.max' => 'Komentar maksimal 10.000 karakter.',
        ];
    }

    /**
     * Prepare data for validation - hanya staff yang bisa set is_internal.
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();

        // Pemohon tidak bisa membuat komentar internal
        if ($user && $user->isPemohon()) {
            $this->merge([
                'is_internal' => false,
            ]);
        }
    }
}
