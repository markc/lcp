import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import React from 'react';

interface Account {
  id?: number;
  login: string;
  fname: string;
  lname: string;
  altemail?: string | null;
  acl: number;
  grp: number;
  vhosts: number;
}

interface AccountFormProps {
  account?: Account;
  roles: Record<number, string>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  errors?: Record<string, string>;
}

export function AccountForm({ 
  account, 
  roles, 
  onSubmit, 
  onCancel, 
  isProcessing = false,
  errors = {}
}: AccountFormProps) {
  // Set default values for a new account or use existing account data
  const defaultValues = account ? {
    login: account.login,
    fname: account.fname,
    lname: account.lname,
    altemail: account.altemail || '',
    acl: account.acl,
    grp: account.grp,
    vhosts: account.vhosts,
    webpw: '',
    webpw_confirmation: '',
  } : {
    login: '',
    fname: '',
    lname: '',
    altemail: '',
    acl: 2, // Default to regular user
    grp: 0,
    vhosts: 1,
    webpw: '',
    webpw_confirmation: '',
  };

  const { data, setData } = useForm(defaultValues);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="login">Email / Login</Label>
            <Input
              id="login"
              type="email"
              value={data.login}
              onChange={(e) => setData('login', e.target.value)}
              required
            />
            {errors.login && (
              <p className="text-red-500 text-sm mt-1">{errors.login}</p>
            )}
          </div>

          <div>
            <Label htmlFor="altemail">Alternative Email</Label>
            <Input
              id="altemail"
              type="email"
              value={data.altemail}
              onChange={(e) => setData('altemail', e.target.value)}
            />
            {errors.altemail && (
              <p className="text-red-500 text-sm mt-1">{errors.altemail}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fname">First Name</Label>
            <Input
              id="fname"
              type="text"
              value={data.fname}
              onChange={(e) => setData('fname', e.target.value)}
              required
            />
            {errors.fname && (
              <p className="text-red-500 text-sm mt-1">{errors.fname}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lname">Last Name</Label>
            <Input
              id="lname"
              type="text"
              value={data.lname}
              onChange={(e) => setData('lname', e.target.value)}
              required
            />
            {errors.lname && (
              <p className="text-red-500 text-sm mt-1">{errors.lname}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="acl">Role</Label>
            <Select
              value={data.acl.toString()}
              onValueChange={(value) => setData('acl', parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roles).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.acl && (
              <p className="text-red-500 text-sm mt-1">{errors.acl}</p>
            )}
          </div>

          <div>
            <Label htmlFor="grp">Group</Label>
            <Input
              id="grp"
              type="number"
              min="0"
              value={data.grp}
              onChange={(e) => setData('grp', parseInt(e.target.value))}
              required
            />
            {errors.grp && (
              <p className="text-red-500 text-sm mt-1">{errors.grp}</p>
            )}
          </div>

          <div>
            <Label htmlFor="vhosts">Max Vhosts</Label>
            <Input
              id="vhosts"
              type="number"
              min="0"
              value={data.vhosts}
              onChange={(e) => setData('vhosts', parseInt(e.target.value))}
              required
            />
            {errors.vhosts && (
              <p className="text-red-500 text-sm mt-1">{errors.vhosts}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="webpw">
              {account ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="webpw"
              type="password"
              value={data.webpw}
              onChange={(e) => setData('webpw', e.target.value)}
              required={!account}
            />
            {errors.webpw && (
              <p className="text-red-500 text-sm mt-1">{errors.webpw}</p>
            )}
          </div>

          <div>
            <Label htmlFor="webpw_confirmation">Confirm Password</Label>
            <Input
              id="webpw_confirmation"
              type="password"
              value={data.webpw_confirmation}
              onChange={(e) => setData('webpw_confirmation', e.target.value)}
              required={!account}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </div>
    </form>
  );
}