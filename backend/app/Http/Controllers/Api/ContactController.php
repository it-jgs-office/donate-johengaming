<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email'], 'subject' => ['required', 'string', 'max:200'], 'message' => ['required', 'string', 'max:2000'], 'image' => ['nullable', 'string']]);
        if ($request->user()) {
            $data['name'] = $request->user()->display_name ?: $request->user()->name ?: $request->user()->username;
            $data['email'] = $request->user()->email;
        }

        $imagePath = null;
        if (! empty($data['image']) && preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', $data['image'], $match)) {
            $bytes = base64_decode($match[2], true);
            abort_if($bytes === false || strlen($bytes) > 5 * 1024 * 1024, 422, 'Gambar tidak valid atau terlalu besar');
            $imagePath = 'contacts/'.Str::uuid().'.'.$match[1];
            Storage::disk('public')->put($imagePath, $bytes);
        }
        $contact = Contact::create(['name' => $data['name'], 'email' => $data['email'], 'subject' => $data['subject'], 'message' => $data['message'], 'image_path' => $imagePath, 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'status' => 'unread']);

        return response()->json(['success' => true, 'message' => 'Pesan berhasil dikirim', 'data' => $this->toFrontendArray($contact)], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $contacts = Contact::query()
            ->where('email', $request->user()->email)
            ->latest()
            ->get()
            ->map(fn (Contact $contact): array => $this->toFrontendArray($contact));

        return response()->json(['success' => true, 'data' => $contacts]);
    }

    public function attachment(Contact $contact): BinaryFileResponse
    {
        $imagePath = $contact->image_path;
        abort_unless($imagePath && Storage::disk('public')->exists($imagePath), 404);

        return response()->file(Storage::disk('public')->path($imagePath), [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    private function toFrontendArray(Contact $contact): array
    {
        return [
            '_id' => (string) $contact->id,
            'id' => $contact->id,
            'name' => $contact->name,
            'email' => $contact->email,
            'subject' => $contact->subject,
            'message' => $contact->message,
            'imageUrl' => $contact->image_path ? URL::temporarySignedRoute('contact.attachment', now()->addHours(2), ['contact' => $contact->id]) : null,
            'status' => $contact->status,
            'adminNotes' => $contact->admin_notes,
            'createdAt' => $contact->created_at?->toISOString(),
        ];
    }
}
