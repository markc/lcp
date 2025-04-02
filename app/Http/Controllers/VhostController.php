<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Vhost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VhostController extends Controller
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
    public function index()
    {
        $vhosts = Vhost::with('account:id,login')
            ->select('id', 'aid', 'domain', 'aliases', 'mailboxes', 'mailquota', 'diskquota', 'active', 'created_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->paginate(15);
            
        $accounts = Account::select('id', 'login')
            ->where('acl', '!=', 9) // Exclude suspended accounts
            ->orderBy('login')
            ->get();

        return Inertia::render('Admin/Vhosts/Index', [
            'vhosts' => $vhosts,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $accounts = Account::select('id', 'login')
            ->where('acl', '!=', 9) // Exclude suspended accounts
            ->orderBy('login')
            ->get();

        return Inertia::render('Admin/Vhosts/Create', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'aid' => ['required', 'integer', 'exists:accounts,id'],
            'domain' => ['required', 'string', 'max:63', 'unique:vhosts'],
            'uname' => ['required', 'string', 'max:63'],
            'uid' => ['required', 'integer', 'min:1000'],
            'gid' => ['required', 'integer', 'min:1000'],
            'aliases' => ['required', 'integer', 'min:0'],
            'mailboxes' => ['required', 'integer', 'min:0'],
            'mailquota' => ['required', 'integer', 'min:0'],
            'diskquota' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ]);

        // Create the vhost
        $vhost = Vhost::create($validated);

        // Run system command to configure the domain
        // Note: In a production environment, you would want to run this in a queue
        if ($vhost && $request->input('configure_domain', false)) {
            $domainName = $validated['domain'];
            
            // Run system command securely
            $result = Process::timeout(60)->run("sudo addvhost {$domainName}");
            
            if ($result->successful()) {
                return redirect()->route('admin.vhosts.index')
                    ->with('success', "Virtual host {$domainName} created successfully and domain configured.");
            } else {
                return redirect()->route('admin.vhosts.index')
                    ->with('warning', "Virtual host created but domain configuration failed: {$result->errorOutput()}");
            }
        }

        return redirect()->route('admin.vhosts.index')
            ->with('success', 'Virtual host created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Vhost $vhost)
    {
        $vhost->load('account:id,login', 'mailboxes', 'aliases');
        
        return Inertia::render('Admin/Vhosts/Show', [
            'vhost' => $vhost,
            'mailboxes_count' => $vhost->mailboxes->count(),
            'aliases_count' => $vhost->aliases->count(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vhost $vhost)
    {
        $accounts = Account::select('id', 'login')
            ->where('acl', '!=', 9) // Exclude suspended accounts
            ->orderBy('login')
            ->get();

        return Inertia::render('Admin/Vhosts/Edit', [
            'vhost' => $vhost,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vhost $vhost)
    {
        $validated = $request->validate([
            'aid' => ['required', 'integer', 'exists:accounts,id'],
            'domain' => ['required', 'string', 'max:63', Rule::unique('vhosts')->ignore($vhost->id)],
            'uname' => ['required', 'string', 'max:63'],
            'uid' => ['required', 'integer', 'min:1000'],
            'gid' => ['required', 'integer', 'min:1000'],
            'aliases' => ['required', 'integer', 'min:0'],
            'mailboxes' => ['required', 'integer', 'min:0'],
            'mailquota' => ['required', 'integer', 'min:0'],
            'diskquota' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ]);

        // Update the vhost
        $vhost->update($validated);

        return redirect()->route('admin.vhosts.index')
            ->with('success', 'Virtual host updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vhost $vhost)
    {
        $domainName = $vhost->domain;
        
        // Delete related data first
        $vhost->mailboxes()->delete();
        $vhost->aliases()->delete();
        
        // Delete the vhost
        $vhost->delete();

        // Run system command to remove domain configuration
        // Note: In a production environment, you would want to run this in a queue
        $result = Process::timeout(60)->run("sudo rmvhost {$domainName}");
        
        if ($result->successful()) {
            return redirect()->route('admin.vhosts.index')
                ->with('success', "Virtual host {$domainName} and related data removed successfully.");
        } else {
            return redirect()->route('admin.vhosts.index')
                ->with('warning', "Virtual host and database records removed, but domain configuration cleanup may have failed: {$result->errorOutput()}");
        }
    }
    
    /**
     * Remove multiple vhosts from storage.
     */
    public function destroyMultiple(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:vhosts,id'],
        ]);
        
        $ids = $validated['ids'];
        $vhosts = Vhost::whereIn('id', $ids)->get();
        $successCount = 0;
        $failureCount = 0;
        
        foreach ($vhosts as $vhost) {
            $domainName = $vhost->domain;
            
            // Delete related data first
            $vhost->mailboxes()->delete();
            $vhost->aliases()->delete();
            
            // Delete the vhost
            $vhost->delete();
            
            // Run system command to remove domain configuration
            $result = Process::timeout(60)->run("sudo rmvhost {$domainName}");
            
            if ($result->successful()) {
                $successCount++;
            } else {
                $failureCount++;
            }
        }
        
        if ($failureCount > 0) {
            return redirect()->route('admin.vhosts.index')
                ->with('warning', "$successCount virtual hosts deleted successfully. $failureCount had system cleanup issues.");
        }
        
        return redirect()->route('admin.vhosts.index')
            ->with('success', "$successCount virtual hosts deleted successfully.");
    }
    
    /**
     * Run a system command for the vhost.
     */
    public function executeCommand(Request $request, Vhost $vhost)
    {
        $validated = $request->validate([
            'command' => ['required', 'string', Rule::in(['restart', 'status', 'fix_permissions'])],
        ]);
        
        $command = $validated['command'];
        $domainName = $vhost->domain;
        
        // Map commands to actual system commands
        $systemCommands = [
            'restart' => "sudo systemctl restart apache2",
            'status' => "sudo systemctl status apache2",
            'fix_permissions' => "sudo fixvhost {$domainName}",
        ];
        
        // Run the selected command
        $result = Process::timeout(60)->run($systemCommands[$command]);
        
        if ($result->successful()) {
            return back()->with('success', "Command executed successfully: {$command}");
        } else {
            return back()->with('error', "Command failed: {$result->errorOutput()}");
        }
    }
}
