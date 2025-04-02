<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vhost extends Model
{
    use HasFactory;
    
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'vhosts';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'aid',
        'domain',
        'uname',
        'uid',
        'gid',
        'aliases',
        'mailboxes',
        'mailquota',
        'diskquota',
        'active',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
        'mailquota' => 'integer',
        'diskquota' => 'integer',
    ];
    
    /**
     * Get the account that owns the vhost
     *
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'aid');
    }
    
    /**
     * Get the mailboxes for the vhost
     *
     * @return HasMany
     */
    public function mailboxes(): HasMany
    {
        return $this->hasMany(Vmail::class, 'hid');
    }
    
    /**
     * Get the aliases for the vhost
     *
     * @return HasMany
     */
    public function aliases(): HasMany
    {
        return $this->hasMany(Valias::class, 'hid');
    }
    
    /**
     * Get mailquota formatted
     *
     * @return string
     */
    public function getFormattedMailQuotaAttribute(): string
    {
        return $this->formatBytes($this->mailquota);
    }
    
    /**
     * Get diskquota formatted
     *
     * @return string
     */
    public function getFormattedDiskQuotaAttribute(): string
    {
        return $this->formatBytes($this->diskquota);
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
