<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Account;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'account_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }
    
    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        // Check the direct is_admin flag first
        if ($this->is_admin) {
            return true;
        }
        
        try {
            // As a fallback, check the Account model for admin privileges
            // This is for the migration period when accounts are being transferred
            if ($this->account_id) {
                return (bool) Account::where('id', $this->account_id)
                    ->whereIn('acl', [0, 1]) // 0 = SuperAdmin, 1 = Administrator
                    ->exists();
            }
            
            // Check by email as last resort
            return (bool) Account::where('login', $this->email)
                ->whereIn('acl', [0, 1]) // 0 = SuperAdmin, 1 = Administrator
                ->exists();
        } catch (\Exception $e) {
            // If there's an error (like table doesn't exist yet), fallback to false
            // This is crucial during initial setup and migrations
            return false;
        }
    }
    
    /**
     * Get the associated account.
     */
    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}
