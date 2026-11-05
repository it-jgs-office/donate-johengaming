<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\LocalSpeechController;
use App\Http\Controllers\Api\OverlayController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok', 'service' => 'johen-donate-api']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/resend-verification-email', [AuthController::class, 'resendVerificationEmail'])->middleware('throttle:3,1');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/check-username', [AuthController::class, 'checkUsername']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('/creators/list', [SystemController::class, 'creators']);
Route::post('/donate/track-share', [DonationController::class, 'trackShare']);
Route::get('/donate/share-stats/{username}', [DonationController::class, 'shareStats']);
Route::get('/donate/{username}', [DonationController::class, 'show']);
Route::post('/donate/{username}', [DonationController::class, 'store']);
Route::match(['get', 'post'], '/check-payment-status', [DonationController::class, 'paymentStatus']);
Route::post('/contact', [ContactController::class, 'store']);
Route::get('/contact/{contact}/attachment', [ContactController::class, 'attachment'])
    ->middleware('signed')
    ->name('contact.attachment');
Route::get('/user/profile-image/{user}', [ProfileController::class, 'image']);
Route::get('/user/cover-image/{user}', [ProfileController::class, 'coverImage']);

Route::post('/webhook/midtrans', [WebhookController::class, 'midtrans']);
Route::post('/donation/incoming', [WebhookController::class, 'incoming']);

Route::get('/overlay/latest-donations', [OverlayController::class, 'latestDonations']);
Route::get('/overlay/donations/{donation}/speech', [LocalSpeechController::class, 'donation'])
    ->middleware(['signed', 'throttle:20,1'])
    ->name('overlay.donation-speech');
Route::get('/overlay/preview-speech', [LocalSpeechController::class, 'preview'])
    ->middleware(['signed', 'throttle:20,1'])
    ->name('overlay.preview-speech');
Route::get('/overlay/leaderboard', [OverlayController::class, 'leaderboard']);
Route::get('/overlay/replay-trigger', [OverlayController::class, 'replay']);
Route::get('/mediashare/{username}', [OverlayController::class, 'mediaShares']);
Route::put('/mediashare/{username}', [OverlayController::class, 'mediaShares']);
Route::get('/overlay-config', [OverlayController::class, 'config']);
Route::get('/overlay-config/notifications', fn (Request $request, OverlayController $controller) => $controller->config($request, 'notifications'));
Route::get('/overlay-config/leaderboard', fn (Request $request, OverlayController $controller) => $controller->config($request, 'leaderboard'));
Route::get('/user/notification-background/{user}', [ProfileController::class, 'notificationBackground']);
Route::get('/user/notification-decoration/{user}', [ProfileController::class, 'notificationDecoration']);
Route::get('/user/notification-decoration/{user}/{decorationId}', [ProfileController::class, 'notificationDecoration']);

Route::post('/cron/archive-donations', [SystemController::class, 'archive']);
Route::post('/archive/trigger', [SystemController::class, 'archive']);
Route::get('/archive/status', [SystemController::class, 'archiveStatus']);
Route::post('/cron/update-leaderboard', fn () => response()->json(['success' => true]));

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/user/profile', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/upload-image', [ProfileController::class, 'uploadImage']);
    Route::post('/user/upload-cover-image', [ProfileController::class, 'uploadCoverImage']);
    Route::post('/user/upload-notification-background', [ProfileController::class, 'uploadNotificationBackground']);
    Route::post('/user/upload-notification-decoration', [ProfileController::class, 'uploadNotificationDecoration']);
    Route::delete('/user/notification-decoration', [ProfileController::class, 'deleteNotificationDecoration']);
    Route::delete('/user/notification-decoration/{decorationId}', [ProfileController::class, 'deleteNotificationDecoration']);
    Route::any('/user/password', fn () => response()->json(['message' => 'Endpoint removed'], 404));

    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/donations', [DashboardController::class, 'donations']);
    Route::get('/dashboard/history', [DashboardController::class, 'history']);
    Route::match(['patch', 'delete'], '/dashboard/donations/{donation}', [DashboardController::class, 'updateDonation']);
    Route::get('/dashboard/leaderboard', [DashboardController::class, 'leaderboard']);

    Route::get('/creator/payouts', [PayoutController::class, 'index']);
    Route::post('/creator/request-payout', [PayoutController::class, 'store']);
    Route::post('/creator/weekly-payout', [PayoutController::class, 'store']);
    Route::get('/creator/feedback', [ContactController::class, 'index']);
    Route::post('/creator/feedback', [ContactController::class, 'store']);
    Route::match(['get', 'put', 'post'], '/creator/filtered-words', [ProfileController::class, 'filteredWords']);
    Route::match(['post', 'put'], '/creator/toggle-donation', [ProfileController::class, 'toggleDonation']);
    Route::match(['post', 'put'], '/creator/toggle-mediashare', [ProfileController::class, 'toggleMediaShare']);
    Route::match(['put', 'post'], '/overlay-config', [ProfileController::class, 'overlayConfig']);
    Route::post('/overlay/replay-trigger', [OverlayController::class, 'replay']);
    Route::post('/overlay/preview-speech-url', [LocalSpeechController::class, 'previewUrl']);
    Route::delete('/mediashare/{username}', [OverlayController::class, 'skipMediaShare']);

    Route::get('/admin/creators', [AdminController::class, 'creators']);
    Route::patch('/admin/creators/{user}/tts', [AdminController::class, 'updateCreatorTts']);
    Route::delete('/admin/creators/{user}', [AdminController::class, 'deleteCreator']);
    Route::get('/admin/donations', [AdminController::class, 'donations']);
    Route::match(['get', 'put'], '/admin/settings/service-fee', [AdminController::class, 'serviceFee']);
    Route::match(['get', 'put', 'delete'], '/admin/feedback', [AdminController::class, 'feedback']);
    Route::get('/admin/payouts', [PayoutController::class, 'adminIndex']);
    Route::post('/admin/payouts', [PayoutController::class, 'store']);
    Route::put('/admin/payouts', [PayoutController::class, 'update']);
    Route::get('/debug/pending-donations', [SystemController::class, 'pending']);
});
