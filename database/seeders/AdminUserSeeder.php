<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Account;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin account already exists
        $existingAccount = Account::where('login', 'admin@example.com')->first();
        $existingUser = User::where('email', 'admin@example.com')->first();
        
        if (!$existingAccount) {
            // Create admin account
            $account = Account::create([
                'grp' => 0,
                'acl' => 0, // SuperAdmin
                'vhosts' => 10,
                'login' => 'admin@example.com',
                'fname' => 'Admin',
                'lname' => 'User',
                'altemail' => 'admin@example.com',
                'webpw' => Hash::make('Admin#123456')
            ]);
            
            $this->command->info('Admin account created successfully.');
        } else {
            $account = $existingAccount;
            $this->command->info('Admin account already exists, using existing account.');
        }
        
        // Create or update admin user
        if (!$existingUser) {
            // Create admin user
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('Admin#123456'),
                'is_admin' => true,
                'account_id' => $account->id,
            ]);
            
            $this->command->info('Admin user created successfully.');
        } else {
            // Update existing user
            $existingUser->is_admin = true;
            $existingUser->account_id = $account->id;
            $existingUser->save();
            
            $this->command->info('Admin user updated successfully.');
        }
        
        $this->command->info('Login: admin@example.com');
        $this->command->info('Password: Admin#123456');
    }
}
