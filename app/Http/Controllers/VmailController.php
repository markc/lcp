<?php

namespace App\Http\Controllers;

use App\Models\Vhost;
use App\Models\Vmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VmailController extends Controller
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
        $query = Vmail::with('vhost:id,domain');
        
        // Filter by vhost if provided
        if ($vhost) {
            $query->where('hid', $vhost->id);
        }
        
        // Search functionality
        if ($search = $request->input('search')) {
            $query->where('user', 'like', "%{$search}%");
        }
        
        // Get paginated results
        $vmails = $query->select('id', 'hid', 'aid', 'user', 'quota', 'active', 'spamf', 'created_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Get all vhosts for filtering
        $vhosts = Vhost::select('id', 'domain')->orderBy('domain')->get();
        
        return Inertia::render('Admin/Vmails/Index', [
            'vmails' => $vmails,
            'vhosts' => $vhosts,
            'filters' => [
                'search' => $search,
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
        
        return Inertia::render('Admin/Vmails/Create', [
            'vhosts' => $vhosts,
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
        
        // Extract username and set the vhost domain
        $username = $request->input('username');
        $domain = $vhost->domain;
        $user = "{$username}@{$domain}";
        
        // Validate the request
        $validated = $request->validate([
            'hid' => ['required', 'integer', 'exists:vhosts,id'],
            'username' => [
                'required', 
                'string', 
                'max:63',
                Rule::unique('vmails', 'user')->where(function ($query) use ($domain) {
                    return $query->where('user', 'like', "%@{$domain}");
                }),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'quota' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
            'spamf' => ['required', 'boolean'],
        ]);
        
        // Check if vhost has reached mailbox limit
        $currentMailboxCount = Vmail::where('hid', $vhost->id)->count();
        if ($currentMailboxCount >= $vhost->mailboxes) {
            return back()->withErrors(['hid' => 'This virtual host has reached its mailbox limit.']);
        }
        
        // Create mailbox data
        $mailboxData = [
            'aid' => $vhost->aid, // Set account ID from the vhost
            'hid' => $vhost->id,
            'gid' => $vhost->gid,
            'uid' => $vhost->uid,
            'user' => $user,
            'home' => "/var/mail/vhosts/{$domain}/{$username}",
            'password' => Hash::make($validated['password']),
            'quota' => $validated['quota'],
            'active' => $validated['active'],
            'spamf' => $validated['spamf'],
        ];
        
        // Create the mailbox
        $vmail = Vmail::create($mailboxData);
        
        // Run system command to set up the mailbox
        if ($vmail && $request->input('setup_mailbox', true)) {
            $result = Process::timeout(60)->run("sudo addmailbox {$user} '{$validated['password']}'");
            
            if ($result->successful()) {
                return redirect()->route('admin.vmails.index')
                    ->with('success', "Mailbox {$user} created successfully.");
            } else {
                return redirect()->route('admin.vmails.index')
                    ->with('warning', "Mailbox created in database but system setup failed: {$result->errorOutput()}");
            }
        }
        
        return redirect()->route('admin.vmails.index')
            ->with('success', 'Mailbox created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Vmail $vmail)
    {
        $vmail->load('vhost:id,domain', 'account:id,login');
        
        // Get mailbox usage statistics
        $usageStats = $this->getMailboxStats($vmail->user);
        
        return Inertia::render('Admin/Vmails/Show', [
            'vmail' => $vmail,
            'usageStats' => $usageStats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vmail $vmail)
    {
        $vmail->load('vhost:id,domain');
        
        // Extract username from email
        $emailParts = explode('@', $vmail->user);
        $username = $emailParts[0];
        
        // Pass the extracted username to the form
        $vmail->username = $username;
        
        $vhosts = Vhost::where('active', true)
            ->select('id', 'domain')
            ->orderBy('domain')
            ->get();
            
        return Inertia::render('Admin/Vmails/Edit', [
            'vmail' => $vmail,
            'vhosts' => $vhosts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vmail $vmail)
    {
        // Get the selected vhost
        $vhost = Vhost::findOrFail($request->input('hid'));
        
        // Extract username and set the vhost domain
        $username = $request->input('username');
        $domain = $vhost->domain;
        $user = "{$username}@{$domain}";
        
        // Validate the request
        $validated = $request->validate([
            'hid' => ['required', 'integer', 'exists:vhosts,id'],
            'username' => [
                'required', 
                'string', 
                'max:63',
                Rule::unique('vmails', 'user')->ignore($vmail->id)->where(function ($query) use ($domain) {
                    return $query->where('user', 'like', "%@{$domain}");
                }),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'quota' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
            'spamf' => ['required', 'boolean'],
        ]);
        
        // Build update data
        $updateData = [
            'aid' => $vhost->aid,
            'hid' => $vhost->id,
            'gid' => $vhost->gid,
            'uid' => $vhost->uid,
            'user' => $user,
            'home' => "/var/mail/vhosts/{$domain}/{$username}",
            'quota' => $validated['quota'],
            'active' => $validated['active'],
            'spamf' => $validated['spamf'],
        ];
        
        // Update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
            
            // Run system command to update password
            $result = Process::timeout(30)->run("sudo updatemailbox {$user} '{$validated['password']}'");
            
            if (!$result->successful()) {
                return back()->with('error', "Failed to update mailbox password: {$result->errorOutput()}");
            }
        }
        
        // Check if the domain has changed
        $domainChanged = ($vmail->user !== $user);
        
        // Update the mailbox
        $vmail->update($updateData);
        
        // If domain changed, run system command to move mailbox
        if ($domainChanged && $request->input('move_mailbox', true)) {
            $result = Process::timeout(60)->run("sudo movemailbox {$vmail->user} {$user}");
            
            if (!$result->successful()) {
                return redirect()->route('admin.vmails.index')
                    ->with('warning', "Mailbox updated in database but system migration failed: {$result->errorOutput()}");
            }
        }
        
        return redirect()->route('admin.vmails.index')
            ->with('success', 'Mailbox updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vmail $vmail)
    {
        $email = $vmail->user;
        
        // Delete the mailbox from the database
        $vmail->delete();
        
        // Run system command to remove mailbox
        $result = Process::timeout(30)->run("sudo rmmailbox {$email}");
        
        if ($result->successful()) {
            return redirect()->route('admin.vmails.index')
                ->with('success', "Mailbox {$email} removed successfully.");
        } else {
            return redirect()->route('admin.vmails.index')
                ->with('warning', "Mailbox removed from database but system cleanup failed: {$result->errorOutput()}");
        }
    }
    
    /**
     * Remove multiple mailboxes from storage.
     */
    public function destroyMultiple(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:vmails,id'],
        ]);
        
        $ids = $validated['ids'];
        $vmails = Vmail::whereIn('id', $ids)->get();
        $successCount = 0;
        $failureCount = 0;
        
        foreach ($vmails as $vmail) {
            $email = $vmail->user;
            
            // Delete the mailbox from the database
            $vmail->delete();
            
            // Run system command to remove mailbox
            $result = Process::timeout(30)->run("sudo rmmailbox {$email}");
            
            if ($result->successful()) {
                $successCount++;
            } else {
                $failureCount++;
            }
        }
        
        if ($failureCount > 0) {
            return redirect()->route('admin.vmails.index')
                ->with('warning', "$successCount mailboxes deleted successfully. $failureCount had system cleanup issues.");
        }
        
        return redirect()->route('admin.vmails.index')
            ->with('success', "$successCount mailboxes deleted successfully.");
    }
    
    /**
     * Get mailbox statistics.
     */
    protected function getMailboxStats(string $email): array
    {
        // Run system command to get mailbox stats
        $result = Process::timeout(30)->run("sudo mailboxstats {$email}");
        
        if ($result->successful()) {
            $output = $result->output();
            
            // Parse the output format
            // Typical output: "total:1024,inbox:768,spam:256,sent:128"
            $stats = [];
            $parts = explode(',', $output);
            
            foreach ($parts as $part) {
                [$key, $value] = explode(':', trim($part));
                $stats[$key] = (int) $value;
            }
            
            return $stats;
        }
        
        // Return default values if the command fails
        return [
            'total' => 0,
            'inbox' => 0,
            'spam' => 0,
            'sent' => 0,
        ];
    }
    
    /**
     * Execute a maintenance command for the mailbox.
     */
    public function executeCommand(Request $request, Vmail $vmail)
    {
        $validated = $request->validate([
            'command' => ['required', 'string', Rule::in(['clear_spam', 'rebuild', 'check', 'quota_reset'])],
        ]);
        
        $command = $validated['command'];
        $email = $vmail->user;
        
        // Map commands to actual system commands
        $systemCommands = [
            'clear_spam' => "sudo clearmailspam {$email}",
            'rebuild' => "sudo rebuildmailbox {$email}",
            'check' => "sudo checkmailbox {$email}",
            'quota_reset' => "sudo resetmailquota {$email}",
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
