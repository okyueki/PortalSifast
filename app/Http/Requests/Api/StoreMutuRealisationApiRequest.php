<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreMutuRealisationApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canRecordMutuRealisation() ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mutu_indicator_id' => ['required', 'exists:mutu_indicators,id'],
            'period_date' => ['required', 'date'],
            'numerator_value' => ['required', 'numeric', 'min:0'],
            'denominator_value' => ['required', 'numeric', 'min:0'],
            'dep_id' => ['nullable', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mutu_indicator_id.required' => 'Indikator wajib dipilih.',
            'period_date.required' => 'Tanggal periode wajib diisi.',
            'numerator_value.required' => 'Nilai numerator wajib diisi.',
            'denominator_value.required' => 'Nilai denominator wajib diisi.',
        ];
    }
}
