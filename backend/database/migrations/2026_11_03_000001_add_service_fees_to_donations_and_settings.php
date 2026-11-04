<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->decimal('value', 5, 2)->default(0);
            $table->timestamps();
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->decimal('service_fee_percentage', 5, 2)->nullable()->after('amount');
            $table->unsignedBigInteger('service_fee_amount')->nullable()->after('service_fee_percentage');
            $table->unsignedBigInteger('net_amount')->nullable()->after('service_fee_amount');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn(['service_fee_percentage', 'service_fee_amount', 'net_amount']);
        });

        Schema::dropIfExists('system_settings');
    }
};
