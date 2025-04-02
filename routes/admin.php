<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\VhostController;
use App\Http\Controllers\VmailController;
use App\Http\Controllers\ValiasController;
use Illuminate\Support\Facades\Route;

// Admin routes protected by auth and admin middleware
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/', function () {
        return redirect()->route('admin.accounts.index');
    })->name('dashboard');
    
    // Accounts (users)
    Route::resource('accounts', AccountController::class);
    Route::post('accounts/destroy-multiple', [AccountController::class, 'destroyMultiple'])
        ->name('accounts.destroyMultiple');
    Route::post('accounts/{account}/switch', [AccountController::class, 'switchToUser'])
        ->name('accounts.switch');
    Route::post('accounts/switch-back', [AccountController::class, 'switchBack'])
        ->name('accounts.switchBack');
    
    // Virtual hosts
    Route::resource('vhosts', VhostController::class);
    Route::post('vhosts/destroy-multiple', [VhostController::class, 'destroyMultiple'])
        ->name('vhosts.destroyMultiple');
    Route::post('vhosts/{vhost}/execute', [VhostController::class, 'executeCommand'])
        ->name('vhosts.execute');
    
    // Mailboxes
    Route::resource('vmails', VmailController::class);
    Route::post('vmails/destroy-multiple', [VmailController::class, 'destroyMultiple'])
        ->name('vmails.destroyMultiple');
    Route::get('vhosts/{vhost}/mailboxes', [VmailController::class, 'index'])
        ->name('vhosts.mailboxes');
    Route::post('vmails/{vmail}/execute', [VmailController::class, 'executeCommand'])
        ->name('vmails.execute');
    
    // Mail aliases
    Route::resource('valias', ValiasController::class);
    Route::post('valias/destroy-multiple', [ValiasController::class, 'destroyMultiple'])
        ->name('valias.destroyMultiple');
    Route::get('vhosts/{vhost}/aliases', [ValiasController::class, 'index'])
        ->name('vhosts.aliases');
    Route::get('get-mailboxes', [ValiasController::class, 'getMailboxes'])
        ->name('valias.mailboxes');
});