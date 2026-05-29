<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMutuRealisationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $realisation = $this->route('realisation');
        if (! $realisation) {
            return $user->canRecordMutuRealisation();
        }

        return $user->canManageMutu() || $realisation->input_by === $user->id;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'numerator_value' => ['required', 'numeric', 'min:0'],
            'denominator_value' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'numerator_value.required' => 'Nilai numerator wajib diisi.',
            'denominator_value.required' => 'Nilai denominator wajib diisi.',
        ];
    }
}
