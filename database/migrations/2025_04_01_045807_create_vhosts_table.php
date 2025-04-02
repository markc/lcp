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
        Schema::create('vhosts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid')->default(1)->constrained('accounts')->onDelete('cascade');
            $table->string('domain', 63)->unique();
            $table->string('uname', 63)->default('sysadm');
            $table->integer('uid')->default(1000);
            $table->integer('gid')->default(1000);
            $table->integer('aliases')->default(0);
            $table->integer('mailboxes')->default(0);
            $table->bigInteger('mailquota')->default(0);
            $table->bigInteger('diskquota')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        
        // Create view for vhosts
        DB::statement("
        CREATE VIEW vhosts_view AS
        SELECT vh.id, vh.domain, vh.aliases, vh.mailboxes, vh.mailquota, vh.diskquota, vh.active, vh.updated_at as updated,
            COUNT(DISTINCT vm.id) AS num_mailboxes,
            COUNT(DISTINCT va.id) AS num_aliases
        FROM vhosts vh
        LEFT JOIN vmails vm ON vh.id = vm.hid
        LEFT JOIN valias va ON vh.id = va.hid
        GROUP BY vh.id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS vhosts_view');
        Schema::dropIfExists('vhosts');
    }
};
