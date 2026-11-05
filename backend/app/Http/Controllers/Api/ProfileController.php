<?php

namespace App\Http\Controllers\Api;

use App\Events\OverlayConfigUpdated;
use App\Http\Controllers\Controller;
use App\Models\FilteredWord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $payload = $request->user()->toFrontendArray();

        return response()->json(['success' => true, 'user' => $payload, 'creator' => $payload]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'displayName' => ['required', 'string', 'max:50'],
            'username' => ['nullable', 'string', 'min:3', 'max:30', 'regex:/^[a-zA-Z0-9_-]+$/', Rule::unique('users')->ignore($user->id)],
            'bio' => ['nullable', 'string', 'max:500'],
            'socialLinks' => ['nullable', 'array'],
            'payoutBankName' => ['nullable', 'string', 'max:100'],
            'payoutAccountNumber' => ['nullable', 'regex:/^\d+$/', 'max:50'],
            'payoutAccountHolder' => ['nullable', 'string', 'max:100'],
        ]);

        $payoutReady = $user->hasCompletePayoutSettings();
        $requestedPayout = array_filter([
            'bankName' => $data['payoutBankName'] ?? null,
            'accountNumber' => $data['payoutAccountNumber'] ?? null,
            'accountName' => $data['payoutAccountHolder'] ?? null,
        ], fn ($value) => filled($value));

        if ($payoutReady && $requestedPayout && $requestedPayout !== array_intersect_key($user->payout_settings ?? [], $requestedPayout)) {
            return response()->json(['message' => 'Data rekening sudah dikunci dan tidak bisa diubah.'], 422);
        }
        if (! $payoutReady && $requestedPayout && count($requestedPayout) !== 3) {
            return response()->json(['message' => 'Lengkapi semua field rekening sekaligus.'], 422);
        }

        $user->update([
            'name' => $data['displayName'],
            'display_name' => $data['displayName'],
            'username' => isset($data['username']) ? strtolower($data['username']) : $user->username,
            'bio' => $data['bio'] ?? $user->bio,
            'social_links' => $data['socialLinks'] ?? $user->social_links,
            'payout_settings' => $payoutReady ? $user->payout_settings : ($requestedPayout ?: $user->payout_settings),
        ]);

        return response()->json(['success' => true, 'message' => 'Profil berhasil diupdate', 'user' => $user->fresh()->toFrontendArray()]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => ['nullable', 'image', 'max:5120'], 'imageData' => ['nullable', 'string']]);
        $user = $request->user();
        if ($user->profile_image_path) {
            Storage::disk('public')->delete($user->profile_image_path);
        }
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('profiles', 'public');
        } else {
            abort_unless(preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', (string) $request->input('imageData'), $match), 422, 'Format gambar tidak valid');
            $bytes = base64_decode($match[2], true);
            abort_if($bytes === false || strlen($bytes) > 5 * 1024 * 1024, 422, 'Ukuran gambar terlalu besar');
            $path = 'profiles/'.Str::uuid().'.'.$match[1];
            Storage::disk('public')->put($path, $bytes);
        }
        $user->update(['profile_image_path' => $path]);
        $url = url('/api/user/profile-image/'.$user->id);

        return response()->json(['success' => true, 'profileImage' => $url, 'imageUrl' => $url]);
    }

    public function image(User $user): BinaryFileResponse
    {
        abort_unless($user->profile_image_path && Storage::disk('public')->exists($user->profile_image_path), 404);

        return response()->file(Storage::disk('public')->path($user->profile_image_path), [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function uploadCoverImage(Request $request): JsonResponse
    {
        $request->validate(['image' => ['nullable', 'image', 'max:5120'], 'imageData' => ['nullable', 'string']]);
        $user = $request->user();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('covers', 'public');
        } else {
            abort_unless(preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', (string) $request->input('imageData'), $match), 422, 'Format gambar tidak valid');
            $bytes = base64_decode($match[2], true);
            abort_if($bytes === false || strlen($bytes) > 5 * 1024 * 1024, 422, 'Ukuran gambar terlalu besar');
            $path = 'covers/'.Str::uuid().'.'.$match[1];
            Storage::disk('public')->put($path, $bytes);
        }

        if ($user->cover_image_path) {
            Storage::disk('public')->delete($user->cover_image_path);
        }

        $user->update(['cover_image_path' => $path]);
        $url = url('/api/user/cover-image/'.$user->id);

        return response()->json(['success' => true, 'coverImage' => $url, 'imageUrl' => $url]);
    }

    public function coverImage(User $user): BinaryFileResponse
    {
        abort_unless($user->cover_image_path && Storage::disk('public')->exists($user->cover_image_path), 404);

        return response()->file(Storage::disk('public')->path($user->cover_image_path), [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function uploadNotificationBackground(Request $request): JsonResponse
    {
        $data = $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120']]);
        $user = $request->user();
        $config = $user->overlay_config ?? [];
        $alertStyle = $config['notifications']['alertStyle'] ?? [];
        $oldPath = $alertStyle['backgroundImagePath'] ?? null;
        $path = $data['image']->store('notification-backgrounds', 'public');

        if (is_string($oldPath) && str_starts_with($oldPath, 'notification-backgrounds/')) {
            Storage::disk('public')->delete($oldPath);
        }

        $alertStyle['backgroundImagePath'] = $path;
        $alertStyle['backgroundImage'] = url('/api/user/notification-background/'.$user->id).'?v='.Str::uuid();
        $config['notifications']['alertStyle'] = $alertStyle;
        $user->update(['overlay_config' => $config]);

        return response()->json([
            'success' => true,
            'backgroundImage' => $alertStyle['backgroundImage'],
            'backgroundImagePath' => $path,
        ]);
    }

    public function notificationBackground(User $user): BinaryFileResponse
    {
        $path = data_get($user->overlay_config, 'notifications.alertStyle.backgroundImagePath');
        abort_unless(is_string($path) && str_starts_with($path, 'notification-backgrounds/') && Storage::disk('public')->exists($path), 404);

        return response()->file(Storage::disk('public')->path($path), [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function uploadNotificationDecoration(Request $request): JsonResponse
    {
        $data = $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120']]);
        $user = $request->user();
        $config = $user->overlay_config ?? [];
        $alertStyle = $config['notifications']['alertStyle'] ?? [];
        $decorations = array_values($alertStyle['decorations'] ?? []);

        if ($decorations === [] && ! empty($alertStyle['decorationImage'])) {
            $decorations[] = [
                'id' => 'legacy',
                'image' => $alertStyle['decorationImage'],
                'imagePath' => $alertStyle['decorationImagePath'] ?? null,
                'x' => $alertStyle['decorationX'] ?? 82,
                'y' => $alertStyle['decorationY'] ?? 50,
                'size' => $alertStyle['decorationSize'] ?? 18,
                'rotation' => $alertStyle['decorationRotation'] ?? 0,
                'flipX' => $alertStyle['decorationFlipX'] ?? false,
                'flipY' => $alertStyle['decorationFlipY'] ?? false,
            ];
        }

        $decorationId = (string) Str::uuid();
        $path = $data['image']->store('notification-decorations', 'public');
        $decoration = [
            'id' => $decorationId,
            'image' => url('/api/user/notification-decoration/'.$user->id.'/'.$decorationId).'?v='.now()->timestamp,
            'imagePath' => $path,
            'x' => 82,
            'y' => 50,
            'size' => 18,
            'rotation' => 0,
            'flipX' => false,
            'flipY' => false,
        ];
        $decorations[] = $decoration;
        $alertStyle['decorations'] = $decorations;
        $config['notifications']['alertStyle'] = $alertStyle;
        $user->update(['overlay_config' => $config]);

        return response()->json(['success' => true, 'decoration' => $decoration]);
    }

    public function deleteNotificationDecoration(Request $request, ?string $decorationId = null): JsonResponse
    {
        $user = $request->user();
        $config = $user->overlay_config ?? [];
        $alertStyle = $config['notifications']['alertStyle'] ?? [];
        $decorations = array_values($alertStyle['decorations'] ?? []);

        if ($decorationId === null || $decorationId === 'legacy') {
            $legacyPath = $alertStyle['decorationImagePath'] ?? null;
            if (is_string($legacyPath) && str_starts_with($legacyPath, 'notification-decorations/')) {
                Storage::disk('public')->delete($legacyPath);
            }
            unset($alertStyle['decorationImagePath']);
            $alertStyle['decorationImage'] = '';
        }

        $decorations = array_values(array_filter($decorations, function (array $decoration) use ($decorationId): bool {
            if ($decorationId !== null && ($decoration['id'] ?? null) !== $decorationId) {
                return true;
            }

            $path = $decoration['imagePath'] ?? null;
            if (is_string($path) && str_starts_with($path, 'notification-decorations/')) {
                Storage::disk('public')->delete($path);
            }

            return false;
        }));

        $alertStyle['decorations'] = $decorations;
        $config['notifications']['alertStyle'] = $alertStyle;
        $user->update(['overlay_config' => $config]);

        return response()->json(['success' => true]);
    }

    public function notificationDecoration(User $user, ?string $decorationId = null): BinaryFileResponse
    {
        if ($decorationId === null || $decorationId === 'legacy') {
            $path = data_get($user->overlay_config, 'notifications.alertStyle.decorationImagePath');
        } else {
            $decorations = data_get($user->overlay_config, 'notifications.alertStyle.decorations', []);
            $decoration = collect($decorations)->firstWhere('id', $decorationId);
            $path = $decoration['imagePath'] ?? null;
        }

        abort_unless(is_string($path) && str_starts_with($path, 'notification-decorations/') && Storage::disk('public')->exists($path), 404);

        return response()->file(Storage::disk('public')->path($path));
    }

    public function toggleDonation(Request $request): JsonResponse
    {
        return $this->toggleSetting($request, 'isEnabled');
    }

    public function toggleMediaShare(Request $request): JsonResponse
    {
        return $this->toggleSetting($request, 'mediaShareEnabled');
    }

    public function filteredWords(Request $request): JsonResponse
    {
        $record = FilteredWord::firstOrCreate(['creator_id' => $request->user()->id], ['words' => []]);
        if ($request->isMethod('put') || $request->isMethod('post')) {
            $data = $request->validate(['words' => ['nullable', 'array'], 'filteredWords' => ['nullable', 'array']]);
            $words = $data['words'] ?? $data['filteredWords'] ?? [];
            $record->update(['words' => array_values(array_unique(array_map('strtolower', $words)))]);
        }
        $words = $record->fresh()->words;

        return response()->json(['success' => true, 'words' => $words, 'filteredWords' => $words]);
    }

    public function overlayConfig(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($request->isMethod('put') || $request->isMethod('post')) {
            $incoming = $request->all();
            $config = array_replace_recursive($user->overlay_config ?? [], $incoming);
            if (is_array(data_get($incoming, 'notifications.alertStyle.decorations'))) {
                $config['notifications']['alertStyle']['decorations'] = array_values($incoming['notifications']['alertStyle']['decorations']);
            }
            $user->update(['overlay_config' => $config]);
            OverlayConfigUpdated::dispatch($user->username, $config);
        }

        return response()->json(['success' => true, 'config' => $user->fresh()->overlay_config ?? []]);
    }

    private function toggleSetting(Request $request, string $key): JsonResponse
    {
        $user = $request->user();
        $settings = $user->donation_settings ?? [];
        $requestKey = $key === 'isEnabled' ? 'isEnabled' : 'mediaShareEnabled';
        if (array_key_exists('enabled', $request->all())) {
            $settings[$key] = $request->boolean('enabled');
        } elseif (array_key_exists($requestKey, $request->all())) {
            $settings[$key] = $request->boolean($requestKey);
        } else {
            $settings[$key] = ! ($settings[$key] ?? true);
        }
        $user->update(['donation_settings' => $settings]);

        return response()->json(['success' => true, 'enabled' => $settings[$key], 'donationSettings' => $settings]);
    }
}
