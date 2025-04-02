<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->integer('grp')->default(0);
            $table->integer('acl')->default(0);
            $table->integer('vhosts')->default(1);
            $table->string('login', 63)->unique();
            $table->string('fname', 63)->default('');
            $table->string('lname', 63)->default('');
            $table->string('altemail', 63)->default('');
            $table->string('otp', 15)->default('');
            $table->integer('otpttl')->default(0);
            $table->string('cookie', 63)->default('');
            $table->string('webpw', 127)->default('');
            $table->timestamps();
            
            $table->index('grp');
            $table->index('acl');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
