<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 30)->nullable()->unique()->after('id');
            $table->string('display_name', 50)->nullable()->after('name');
            $table->string('role', 20)->default('creator')->index();
            $table->text('bio')->nullable();
            $table->string('profile_image_path')->nullable();
            $table->json('social_links')->nullable();
            $table->json('payout_settings')->nullable();
            $table->json('donation_settings')->nullable();
            $table->json('overlay_config')->nullable();
            $table->json('stats')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('last_login_at')->nullable();
            $table->unsignedInteger('login_count')->default(0);
        });

        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('created_by_username', 30)->index();
            $table->string('name', 100);
            $table->string('email')->nullable();
            $table->unsignedBigInteger('amount');
            $table->text('message')->nullable();
            $table->string('status', 20)->default('PENDING')->index();
            $table->string('merchant_ref')->unique();
            $table->string('transaction_id')->nullable();
            $table->string('payment_method')->nullable();
            $table->json('payment_data')->nullable();
            $table->json('media_share_request')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->boolean('is_paid_out')->default(false)->index();
            $table->timestamp('paid_out_at')->nullable();
            $table->unsignedBigInteger('payout_id')->nullable()->index();
            $table->boolean('is_displayed_in_overlay')->default(false);
            $table->timestamp('displayed_at')->nullable();
            $table->timestamps();
            $table->index(['created_by_username', 'status']);
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('creator_username', 30)->index();
            $table->unsignedBigInteger('gross_amount');
            $table->unsignedBigInteger('platform_fee')->default(0);
            $table->unsignedBigInteger('amount');
            $table->string('status', 20)->default('PENDING')->index();
            $table->json('bank_info');
            $table->json('donation_ids');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_note')->nullable();
            $table->string('payout_reference')->unique();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('creator_username', 30)->index();
            $table->string('type', 30)->default('DONATION');
            $table->json('payload');
            $table->boolean('is_read')->default(false);
            $table->boolean('is_displayed')->default(false)->index();
            $table->timestamp('displayed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('media_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('creator_username', 30)->index();
            $table->string('donor_name', 100);
            $table->unsignedBigInteger('amount');
            $table->string('youtube_url');
            $table->string('video_id', 30);
            $table->unsignedInteger('requested_duration')->default(30);
            $table->text('message')->nullable();
            $table->unsignedInteger('queue_position')->default(1);
            $table->string('status', 20)->default('PENDING')->index();
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
        });

        Schema::create('filtered_words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->json('words');
            $table->timestamps();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email');
            $table->string('subject')->nullable();
            $table->text('message');
            $table->string('image_path')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('status', 20)->default('unread')->index();
            $table->timestamps();
        });

        Schema::create('donation_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('platform', 30)->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        Schema::create('donation_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->unique();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('created_by_username', 30)->index();
            $table->json('data');
            $table->timestamp('donated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_histories');
        Schema::dropIfExists('donation_shares');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('filtered_words');
        Schema::dropIfExists('media_shares');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('donations');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'display_name', 'role', 'bio',
                'profile_image_path', 'social_links', 'payout_settings', 'donation_settings',
                'overlay_config', 'stats', 'is_active', 'last_login_at', 'login_count',
            ]);
        });
    }
};
