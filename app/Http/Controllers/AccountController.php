<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Define middleware for the controller.
     */
    public function middleware()
    {
        return [
            'auth',
            'admin:except=show,update',
        ];
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $accounts = Account::query()
            ->select('id', 'login', 'fname', 'lname', 'altemail', 'acl', 'grp', 'vhosts', 'created_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->paginate(15);
        
        return Inertia::render('Admin/Accounts/Index', [
            'accounts' => $accounts,
            'roles' => $this->getRoles(),
            'errors' => session()->get('errors') ? session()->get('errors')->getBag('default')->getMessages() : (object) [],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Accounts/Create', [
            'roles' => $this->getRoles(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'login' => ['required', 'string', 'email', 'max:63', 'unique:accounts'],
            'fname' => ['required', 'string', 'max:63'],
            'lname' => ['required', 'string', 'max:63'],
            'altemail' => ['nullable', 'string', 'email', 'max:63'],
            'acl' => ['required', 'integer', 'min:0', 'max:9'],
            'grp' => ['required', 'integer', 'min:0'],
            'vhosts' => ['required', 'integer', 'min:0'],
            'webpw' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        
        // Handle empty altemail as null
        if (empty($validated['altemail'])) {
            $validated['altemail'] = null;
        }
        
        // Hash the password
        $validated['webpw'] = Hash::make($validated['webpw']);
        
        // Create the account
        Account::create($validated);
        
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }
        
        return redirect()->route('admin.accounts.index')
            ->with('success', 'Account created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Account $account)
    {
        // Ensure the user can only access their own account unless they are an admin
        if (!auth()->user()->isAdmin() && auth()->id() != $account->id) {
            abort(403);
        }
        
        return Inertia::render('Admin/Accounts/Show', [
            'account' => $account,
            'vhosts' => $account->vhosts()->get(['id', 'domain']),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Account $account)
    {
        return Inertia::render('Admin/Accounts/Edit', [
            'account' => $account,
            'roles' => $this->getRoles(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Account $account)
    {
        // Ensure the user can only update their own account unless they are an admin
        if (!auth()->user()->isAdmin() && auth()->id() != $account->id) {
            abort(403);
        }
        
        $validated = $request->validate([
            'login' => ['required', 'string', 'email', 'max:63', Rule::unique('accounts')->ignore($account->id)],
            'fname' => ['required', 'string', 'max:63'],
            'lname' => ['required', 'string', 'max:63'],
            'altemail' => ['nullable', 'string', 'email', 'max:63'],
            'acl' => ['sometimes', 'integer', 'min:0', 'max:9'],
            'grp' => ['sometimes', 'integer', 'min:0'],
            'vhosts' => ['sometimes', 'integer', 'min:0'],
            'webpw' => ['nullable', 'string', 'min:12', 'confirmed'],
        ]);
        
        // Handle empty altemail as null
        if (empty($validated['altemail'])) {
            $validated['altemail'] = null;
        }
        
        // Only allow admin to change these fields
        if (!auth()->user()->isAdmin()) {
            unset($validated['acl'], $validated['grp'], $validated['vhosts']);
        }
        
        // Only update password if provided
        if (isset($validated['webpw']) && $validated['webpw']) {
            $validated['webpw'] = Hash::make($validated['webpw']);
        } else {
            unset($validated['webpw']);
        }
        
        // Update the account
        $account->update($validated);
        
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }
        
        return redirect()->route('admin.accounts.index')
            ->with('success', 'Account updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account)
    {
        // Prevent deleting your own account
        if (auth()->id() == $account->id) {
            return redirect()->back()
                ->with('error', 'You cannot delete your own account.');
        }
        
        $account->delete();
        
        return redirect()->route('admin.accounts.index')
            ->with('success', 'Account deleted successfully.');
    }
    
    /**
     * Remove multiple accounts from storage.
     */
    public function destroyMultiple(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:accounts,id'],
        ]);
        
        $ids = $validated['ids'];
        $currentUserId = auth()->id();
        
        // Remove the current user's ID from the array if present
        $ids = array_filter($ids, function($id) use ($currentUserId) {
            return $id != $currentUserId;
        });
        
        // Delete the accounts
        $count = Account::whereIn('id', $ids)->delete();
        
        if ($count != count($validated['ids'])) {
            return redirect()->route('admin.accounts.index')
                ->with('warning', $count . ' accounts deleted successfully. Your own account was not deleted.');
        }
        
        return redirect()->route('admin.accounts.index')
            ->with('success', $count . ' accounts deleted successfully.');
    }
    
    /**
     * Switch to a user account (admin only).
     */
    public function switchToUser(Account $account)
    {
        // Store the current admin ID
        session()->put('admin_id', auth()->id());
        
        // Login as the target user
        auth()->login($account);
        
        return redirect()->route('dashboard')
            ->with('success', 'Switched to user: ' . $account->login);
    }
    
    /**
     * Switch back to admin account.
     */
    public function switchBack()
    {
        if ($adminId = session()->get('admin_id')) {
            $admin = Account::find($adminId);
            
            if ($admin) {
                auth()->login($admin);
                session()->forget('admin_id');
                
                return redirect()->route('admin.accounts.index')
                    ->with('success', 'Switched back to admin account.');
            }
        }
        
        return redirect()->back()
            ->with('error', 'Could not switch back to admin account.');
    }
    
    /**
     * Get all available roles.
     */
    protected function getRoles(): array
    {
        return [
            0 => 'SuperAdmin',
            1 => 'Administrator',
            2 => 'User',
            3 => 'Suspended',
            9 => 'Anonymous',
        ];
    }
}
