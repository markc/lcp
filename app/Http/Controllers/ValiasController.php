<?php

namespace App\Http\Controllers;

use App\Models\Valias;
use App\Models\Vhost;
use App\Models\Vmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ValiasController extends Controller
{
    /**
     * Define middleware for the controller.
     */
    public function middleware()
    {
        return [
            'auth',
            'admin',
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Vhost $vhost = null)
    {
        $query = Valias::with('vhost:id,domain');
        
        // Filter by vhost if provided
        if ($vhost) {
            $query->where('hid', $vhost->id);
        }
        
        // Search functionality
        if ($search = $request->input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('source', 'like', "%{$search}%")
                  ->orWhere('target', 'like', "%{$search}%");
            });
        }
        
        // Filter by active status
        if ($request->has('active') && $request->input('active') !== '') {
            $query->where('active', $request->boolean('active'));
        }
        
        // Get paginated results
        $aliases = $query->select('id', 'hid', 'aid', 'source', 'target', 'active', 'created_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Get all vhosts for filtering
        $vhosts = Vhost::select('id', 'domain')->orderBy('domain')->get();
        
        // Get mailboxes for the selected vhost if one is provided
        $mailboxes = [];
        if ($vhost) {
            $mailboxes = Vmail::where('hid', $vhost->id)
                ->where('active', true)
                ->select('id', 'user')
                ->orderBy('user')
                ->get();
        }
        
        return Inertia::render('Admin/Valias/Index', [
            'aliases' => $aliases,
            'vhosts' => $vhosts,
            'mailboxes' => $mailboxes,
            'filters' => [
                'search' => $search,
                'active' => $request->input('active'),
                'vhost_id' => $vhost ? $vhost->id : null,
                'vhost_domain' => $vhost ? $vhost->domain : null,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $vhosts = Vhost::where('active', true)
            ->select('id', 'domain')
            ->orderBy('domain')
            ->get();
            
        // Pre-select vhost if provided in query
        $preselectedVhostId = $request->input('vhost_id');
        
        // Get mailboxes for destinations
        $mailboxes = [];
        if ($preselectedVhostId) {
            $mailboxes = Vmail::where('hid', $preselectedVhostId)
                ->where('active', true)
                ->select('id', 'user')
                ->orderBy('user')
                ->get();
        }
        
        return Inertia::render('Admin/Valias/Create', [
            'vhosts' => $vhosts,
            'mailboxes' => $mailboxes,
            'preselectedVhostId' => $preselectedVhostId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Get the selected vhost
        $vhost = Vhost::findOrFail($request->input('hid'));
        
        // Validate the alias
        $validated = $request->validate([
            'hid' => ['required', 'integer', 'exists:vhosts,id'],
            'source' => [
                'required', 
                'string', 
                'max:63',
                function ($attribute, $value, $fail) {
                    // Check if the value contains @ symbol (full email)
                    if (strpos($value, '@') !== false) {
                        // Validate it's a proper email format
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $fail('The source must be a valid email address format.');
                        }
                    }
                },
                Rule::unique('valias')->where(function ($query) use ($request) {
                    return $query->where('hid', $request->input('hid'));
                }),
            ],
            'target' => ['required', 'string', 'max:255'],
            'active' => ['required', 'boolean'],
        ]);
        
        // Check if vhost has reached alias limit
        $currentAliasCount = Valias::where('hid', $vhost->id)->count();
        if ($currentAliasCount >= $vhost->aliases) {
            return back()->withErrors(['hid' => 'This virtual host has reached its alias limit.']);
        }
        
        // Build full domain
        $domain = $vhost->domain;
        
        // Create the alias
        $valias = Valias::create([
            'aid' => $vhost->aid,
            'hid' => $vhost->id,
            'source' => $validated['source'],
            'target' => $validated['target'],
            'active' => $validated['active'],
        ]);
        
        // Run system command to set up the alias
        if ($valias && $request->input('configure_alias', true)) {
            // Check if source already contains @ (full email)
            $sourceValue = $validated['source'];
            if (strpos($sourceValue, '@') === false) {
                // Add domain only if not already a full email
                $source = "{$sourceValue}@{$domain}";
            } else {
                // Already a full email
                $source = $sourceValue;
            }
            
            $result = Process::timeout(30)->run("sudo addalias {$source} '{$validated['target']}'");
            
            if ($result->successful()) {
                return redirect()->route('admin.valias.index')
                    ->with('success', "Alias {$source} created successfully.");
            } else {
                return redirect()->route('admin.valias.index')
                    ->with('warning', "Alias created in database but system setup failed: {$result->errorOutput()}");
            }
        }
        
        return redirect()->route('admin.valias.index')
            ->with('success', 'Alias created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Valias $valias)
    {
        $valias->load('vhost:id,domain', 'account:id,login');
        
        return Inertia::render('Admin/Valias/Show', [
            'valias' => $valias,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Valias $valias)
    {
        $valias->load('vhost:id,domain');
        
        $vhosts = Vhost::where('active', true)
            ->select('id', 'domain')
            ->orderBy('domain')
            ->get();
            
        // Get mailboxes for the current vhost
        $mailboxes = Vmail::where('hid', $valias->hid)
            ->where('active', true)
            ->select('id', 'user')
            ->orderBy('user')
            ->get();
            
        return Inertia::render('Admin/Valias/Edit', [
            'valias' => $valias,
            'vhosts' => $vhosts,
            'mailboxes' => $mailboxes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Valias $valias)
    {
        // Get the selected vhost
        $vhost = Vhost::findOrFail($request->input('hid'));
        
        // Validate the alias
        $validated = $request->validate([
            'hid' => ['required', 'integer', 'exists:vhosts,id'],
            'source' => [
                'required', 
                'string', 
                'max:63',
                function ($attribute, $value, $fail) {
                    // Check if the value contains @ symbol (full email)
                    if (strpos($value, '@') !== false) {
                        // Validate it's a proper email format
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $fail('The source must be a valid email address format.');
                        }
                    }
                },
                Rule::unique('valias')->ignore($valias->id)->where(function ($query) use ($request) {
                    return $query->where('hid', $request->input('hid'));
                }),
            ],
            'target' => ['required', 'string', 'max:255'],
            'active' => ['required', 'boolean'],
        ]);
        
        // Build full source email addresses
        $oldDomain = $valias->vhost->domain;
        $newDomain = $vhost->domain;
        
        // Check if old source already contains @ (full email)
        $oldSourceValue = $valias->source;
        if (strpos($oldSourceValue, '@') === false) {
            // Add domain only if not already a full email
            $oldSource = "{$oldSourceValue}@{$oldDomain}";
        } else {
            // Already a full email
            $oldSource = $oldSourceValue;
        }
        
        // Check if new source already contains @ (full email)
        $newSourceValue = $validated['source'];
        if (strpos($newSourceValue, '@') === false) {
            // Add domain only if not already a full email
            $newSource = "{$newSourceValue}@{$newDomain}";
        } else {
            // Already a full email
            $newSource = $newSourceValue;
        }
        
        $sourceChanged = ($oldSource !== $newSource);
        $targetChanged = ($valias->target !== $validated['target']);
        
        // Update the alias
        $valias->update([
            'aid' => $vhost->aid,
            'hid' => $vhost->id,
            'source' => $validated['source'],
            'target' => $validated['target'],
            'active' => $validated['active'],
        ]);
        
        // Run system command to update the alias if required
        if ($sourceChanged || $targetChanged) {
            if ($sourceChanged) {
                // First remove old alias, then add new one
                Process::timeout(30)->run("sudo rmalias {$oldSource}");
                $result = Process::timeout(30)->run("sudo addalias {$newSource} '{$validated['target']}'");
            } else {
                // Just update the target
                $result = Process::timeout(30)->run("sudo updatealias {$newSource} '{$validated['target']}'");
            }
            
            if (!isset($result) || !$result->successful()) {
                return back()->with('warning', "Alias updated in database but system update failed.");
            }
        }
        
        return redirect()->route('admin.valias.index')
            ->with('success', 'Alias updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Valias $valias)
    {
        // Check if source already contains @ (full email)
        $sourceValue = $valias->source;
        if (strpos($sourceValue, '@') === false) {
            // Add domain only if not already a full email
            $source = "{$sourceValue}@{$valias->vhost->domain}";
        } else {
            // Already a full email
            $source = $sourceValue;
        }
        
        // Delete the alias from the database
        $valias->delete();
        
        // Run system command to remove the alias
        $result = Process::timeout(30)->run("sudo rmalias {$source}");
        
        if ($result->successful()) {
            return redirect()->route('admin.valias.index')
                ->with('success', "Alias {$source} removed successfully.");
        } else {
            return redirect()->route('admin.valias.index')
                ->with('warning', "Alias removed from database but system cleanup failed: {$result->errorOutput()}");
        }
    }
    
    /**
     * Remove multiple mail aliases from storage.
     */
    public function destroyMultiple(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:valias,id'],
        ]);
        
        $ids = $validated['ids'];
        $aliases = Valias::with('vhost')->whereIn('id', $ids)->get();
        $successCount = 0;
        $failureCount = 0;
        
        foreach ($aliases as $valias) {
            // Check if source already contains @ (full email)
            $sourceValue = $valias->source;
            if (strpos($sourceValue, '@') === false) {
                // Add domain only if not already a full email
                $source = "{$sourceValue}@{$valias->vhost->domain}";
            } else {
                // Already a full email
                $source = $sourceValue;
            }
            
            // Delete the alias from the database
            $valias->delete();
            
            // Run system command to remove the alias
            $result = Process::timeout(30)->run("sudo rmalias {$source}");
            
            if ($result->successful()) {
                $successCount++;
            } else {
                $failureCount++;
            }
        }
        
        if ($failureCount > 0) {
            return redirect()->route('admin.valias.index')
                ->with('warning', "$successCount aliases deleted successfully. $failureCount had system cleanup issues.");
        }
        
        return redirect()->route('admin.valias.index')
            ->with('success', "$successCount aliases deleted successfully.");
    }
    
    /**
     * Fetch mailboxes for a specific vhost (for dynamic selection in forms).
     */
    public function getMailboxes(Request $request)
    {
        $request->validate([
            'vhost_id' => ['required', 'integer', 'exists:vhosts,id'],
        ]);
        
        $mailboxes = Vmail::where('hid', $request->input('vhost_id'))
            ->where('active', true)
            ->select('id', 'user')
            ->orderBy('user')
            ->get();
            
        return response()->json($mailboxes);
    }
}
