<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'grp',
        'acl',
        'vhosts',
        'login',
        'fname',
        'lname',
        'altemail',
        'otp',
        'otpttl',
        'cookie',
        'webpw'
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'altemail' => 'string',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'webpw',
        'cookie',
    ];
    
    /**
     * Get the ACL role name
     *
     * @return string
     */
    public function getAclNameAttribute(): string
    {
        $roles = [
            0 => 'SuperAdmin',
            1 => 'Administrator',
            2 => 'User',
            3 => 'Suspended',
            9 => 'Anonymous',
        ];
        
        return $roles[$this->acl] ?? 'Unknown';
    }
    
    /**
     * Get full name
     *
     * @return string
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->fname} {$this->lname}");
    }
    
    /**
     * Get the vhosts for this account
     *
     * @return HasMany
     */
    public function vhosts(): HasMany
    {
        return $this->hasMany(Vhost::class, 'aid');
    }
    
    /**
     * Get the mail accounts for this account
     *
     * @return HasMany
     */
    public function vmails(): HasMany
    {
        return $this->hasMany(Vmail::class, 'aid');
    }
    
    /**
     * Get the aliases for this account
     *
     * @return HasMany
     */
    public function valias(): HasMany
    {
        return $this->hasMany(Valias::class, 'aid');
    }
}
