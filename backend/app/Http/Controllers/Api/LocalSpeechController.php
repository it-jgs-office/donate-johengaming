<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Services\LocalSpeechService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LocalSpeechController extends Controller
{
    public function donation(Donation $donation, LocalSpeechService $speech): BinaryFileResponse
    {
        abort_unless($donation->status === 'PAID', 404);
        abort_if((bool) data_get($donation->media_share_request, 'enabled', false), 404);
        abort_unless((bool) data_get($donation->creator?->overlay_config, 'notifications.ttsEnabled', true), 404);

        return $this->audioResponse($speech->donationSpeechPath($donation));
    }

    public function preview(LocalSpeechService $speech): BinaryFileResponse
    {
        return $this->audioResponse($speech->previewSpeechPath());
    }

    public function previewUrl(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'audioUrl' => URL::temporarySignedRoute(
                'overlay.preview-speech',
                now()->addMinutes(10),
            ),
        ]);
    }

    private function audioResponse(string $path): BinaryFileResponse
    {
        return response()->file($path, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'private, max-age=86400',
        ]);
    }
}
