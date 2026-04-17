<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ImportEmployeeSalariesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'period' => ['required', 'date_format:Y-m'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'period.required' => 'Periode wajib diisi (format: YYYY-MM).',
            'period.date_format' => 'Format periode harus YYYY-MM (contoh: 2025-12).',
            'file.required' => 'File CSV wajib diupload.',
            'file.file' => 'File upload tidak valid.',
            'file.mimes' => 'File harus CSV.',
            'file.max' => 'Ukuran file maksimal 10MB.',
        ];
    }
}
