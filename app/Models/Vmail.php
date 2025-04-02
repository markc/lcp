<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vmail extends Model
{
    use HasFactory;
    
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'vmails';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'aid',
        'hid',
        'gid',
        'uid',
        'spamf',
        'active',
        'quota',
        'user',
        'home',
        'password',
    ];
    
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
        'spamf' => 'boolean',
        'quota' => 'integer',
    ];
    
    /**
     * Get the account that owns the mailbox
     *
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'aid');
    }
    
    /**
     * Get the vhost that owns the mailbox
     *
     * @return BelongsTo
     */
    public function vhost(): BelongsTo
    {
        return $this->belongsTo(Vhost::class, 'hid');
    }
    
    /**
     * Get quota formatted
     *
     * @return string
     */
    public function getFormattedQuotaAttribute(): string
    {
        return $this->formatBytes($this->quota);
    }
    
    /**
     * Get username without domain part
     *
     * @return string
     */
    public function getLocalPartAttribute(): string
    {
        return substr($this->user, 0, strpos($this->user, '@'));
    }
    
    /**
     * Format bytes to human readable format
     *
     * @param int $bytes
     * @param int $precision
     * @return string
     */
    protected function formatBytes($bytes, $precision = 2): string
    {
        if ($bytes === 0) {
            return '0 Bytes';
        }
        
        $units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        $base = log($bytes, 1024);
        
        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $units[floor($base)];
    }
}
