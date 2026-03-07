<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ticket = $this->route('ticket');

        return $this->user()->can('attach', $ticket);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File harus dipilih.',
            'file.file' => 'Upload harus berupa file.',
            'file.max' => 'Ukuran file maksimal 10 MB.',
            'file.mimes' => 'Format file: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, gif, zip.',
        ];
    }
}
