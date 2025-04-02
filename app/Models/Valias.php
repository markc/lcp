<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Valias extends Model
{
    use HasFactory;
    
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'valias';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'aid',
        'hid',
        'active',
        'source',
        'target',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
    ];
    
    /**
     * Get the account that owns the alias
     *
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'aid');
    }
    
    /**
     * Get the vhost that owns the alias
     *
     * @return BelongsTo
     */
    public function vhost(): BelongsTo
    {
        return $this->belongsTo(Vhost::class, 'hid');
    }
    
    /**
     * Get full source email
     * 
     * @return string
     */
    public function getFullSourceAttribute(): string
    {
        $domain = $this->vhost ? $this->vhost->domain : '';
        return $this->source . '@' . $domain;
    }
}
