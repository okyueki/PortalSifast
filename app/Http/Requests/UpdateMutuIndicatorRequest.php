<?php

namespace App\Http\Requests;

use App\Enums\MutuAnalysisPeriod;
use App\Enums\MutuCollectionFrequency;
use App\Enums\MutuIndicatorKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMutuIndicatorRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('accountable_user_id') === '' || $this->input('accountable_user_id') === null) {
            $this->merge(['accountable_user_id' => null]);
        }
        if ($this->input('description') === '') {
            $this->merge(['description' => null]);
        }
        if ($this->input('data_source') === '') {
            $this->merge(['data_source' => null]);
        }
        if ($this->input('target_value') === '') {
            $this->merge(['target_value' => null]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->canManageMutu() ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mutu_category_id' => ['required', 'exists:mutu_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'accountable_user_id' => ['nullable', 'exists:users,id'],
            'indicator_kind' => ['required', Rule::enum(MutuIndicatorKind::class)],
            'collection_frequency' => ['required', Rule::enum(MutuCollectionFrequency::class)],
            'numerator_definition' => ['required', 'string'],
            'denominator_definition' => ['required', 'string'],
            'analysis_period' => ['required', Rule::enum(MutuAnalysisPeriod::class)],
            'has_mutu_benchmarking' => ['nullable', 'boolean'],
            'data_source' => ['nullable', 'string', 'max:255'],
            'target_value' => ['nullable', 'numeric'],
            'weight_in_category' => ['nullable', 'numeric', 'min:0'],
            'dep_ids' => ['required', 'array', 'min:1'],
            'dep_ids.*' => ['string', 'max:32'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul indikator wajib diisi.',
            'dep_ids.required' => 'Pilih minimal satu unit terkait.',
            'dep_ids.min' => 'Pilih minimal satu unit terkait.',
        ];
    }
}
