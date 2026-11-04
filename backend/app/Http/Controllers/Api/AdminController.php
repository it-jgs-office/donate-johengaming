<?php

namespace App\Http\Controllers\Api;

use App\Events\AdminDataUpdated;
use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class AdminController extends Controller
{
    public function creators(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json(['creators' => User::where('role', 'creator')->latest()->get()->map(fn ($user) => $user->toFrontendArray())]);
    }

    public function deleteCreator(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_unless($user->role === 'creator', 404);
        $user->delete();
        AdminDataUpdated::dispatch('all');

        return response()->json(['success' => true]);
    }

    public function updateCreatorTts(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_unless($user->role === 'creator', 404);

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $config = $user->overlay_config ?? [];
        $config = data_set(
            $config,
            'notifications.ttsEnabled',
            $data['enabled'],
        );

        $user->update(['overlay_config' => $config]);

        return response()->json([
            'success' => true,
            'ttsEnabled' => $data['enabled'],
        ]);
    }

    public function donations(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $limit = min(max((int) $request->query('limit', 100), 1), 1000);
        $donations = Donation::latest()->limit($limit)->get();
        $groups = [];
        foreach ($donations as $donation) {
            $key = $donation->created_by_username;
            $groups[$key] ??= ['count' => 0, 'totalAmount' => 0, 'donations' => []];
            $groups[$key]['count']++;
            $groups[$key]['totalAmount'] += $donation->amount;
            $groups[$key]['donations'][] = $donation->toFrontendArray();
        }

        return response()->json(['success' => true, 'data' => $donations->map->toFrontendArray(), 'stats' => ['totalDonations' => $donations->count(), 'totalAmount' => $donations->sum('amount'), 'donationsByCreator' => $groups]]);
    }

    public function serviceFee(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($request->isMethod('put')) {
            $data = $request->validate([
                'percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            ]);

            $updated = DB::table('system_settings')
                ->where('key', 'service_fee_percentage')
                ->update(['value' => $data['percentage'], 'updated_at' => now()]);

            if ($updated === 0 && ! DB::table('system_settings')->where('key', 'service_fee_percentage')->exists()) {
                DB::table('system_settings')->insert([
                    'key' => 'service_fee_percentage',
                    'value' => $data['percentage'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            AdminDataUpdated::dispatch('settings');
        }

        $percentage = (float) (DB::table('system_settings')
            ->where('key', 'service_fee_percentage')
            ->value('value') ?? 0);

        return response()->json(['success' => true, 'percentage' => $percentage]);
    }

    public function feedback(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        if ($request->isMethod('put')) {
            $data = $request->validate(['id' => ['required', 'integer'], 'status' => ['required', 'in:unread,read'], 'adminNotes' => ['nullable', 'string']]);
            $item = Contact::findOrFail($data['id']);
            $item->update(['status' => $data['status'], 'admin_notes' => $data['adminNotes'] ?? $item->admin_notes]);

            return response()->json(['success' => true, 'data' => $item]);
        }
        if ($request->isMethod('delete')) {
            Contact::findOrFail($request->query('id'))->delete();

            return response()->json(['success' => true]);
        }

        $query = Contact::query();
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $search = '%'.$request->query('search').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search)->orWhere('subject', 'like', $search)->orWhere('message', 'like', $search));
        }
        $limit = min((int) $request->query('limit', 50), 100);
        $items = $query->latest()->paginate($limit);
        $feedbacks = collect($items->items())->map(fn ($item) => [
            '_id' => (string) $item->id,
            'id' => $item->id,
            'name' => $item->name,
            'email' => $item->email,
            'subject' => $item->subject,
            'message' => $item->message,
            'imageUrl' => $item->image_path ? URL::temporarySignedRoute('contact.attachment', now()->addHours(2), ['contact' => $item->id]) : null,
            'status' => $item->status,
            'adminNotes' => $item->admin_notes,
            'createdAt' => $item->created_at?->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => $feedbacks, 'pagination' => ['total' => $items->total(), 'page' => $items->currentPage(), 'limit' => $items->perPage(), 'pages' => $items->lastPage()], 'counts' => ['all' => Contact::count(), 'unread' => Contact::where('status', 'unread')->count(), 'read' => Contact::where('status', 'read')->count()]]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403);
    }
}
