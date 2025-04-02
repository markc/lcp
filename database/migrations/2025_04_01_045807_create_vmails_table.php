<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vmails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid')->default(1)->constrained('accounts')->onDelete('cascade');
            $table->foreignId('hid')->default(1)->constrained('vhosts')->onDelete('cascade');
            $table->integer('gid')->default(1000);
            $table->integer('uid')->default(1000);
            $table->boolean('spamf')->default(true);
            $table->boolean('active')->default(true);
            $table->bigInteger('quota')->default(500000000);
            $table->string('user', 63)->unique();
            $table->string('home', 127)->default('');
            $table->string('password', 127)->default('');
            $table->timestamps();
        });
        
        // Create view for vmails
        DB::statement("
        CREATE VIEW vmails_view AS
        SELECT vm.id, vm.user, vm.quota, vm.active, vm.updated_at as updated, vh.domain
        FROM vmails vm
        JOIN vhosts vh ON vh.id = vm.hid
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS vmails_view');
        Schema::dropIfExists('vmails');
    }
};
