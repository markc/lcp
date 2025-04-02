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
        Schema::create('valias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid')->default(1)->constrained('accounts')->onDelete('cascade');
            $table->foreignId('hid')->default(1)->constrained('vhosts')->onDelete('cascade');
            $table->boolean('active')->default(true);
            $table->string('source', 63);
            $table->string('target', 255);
            $table->timestamps();
            
            $table->index('source');
        });
        
        // Create view for valias
        DB::statement("
        CREATE VIEW valias_view AS
        SELECT va.id, va.source, va.target, va.active, va.updated_at as updated, vh.domain
        FROM valias va
        JOIN vhosts vh ON vh.id = va.hid
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS valias_view');
        Schema::dropIfExists('valias');
    }
};
