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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import React from 'react';

interface Vhost {
  id: number;
  domain: string;
}

interface Vmail {
  id?: number;
  hid: number;
  user: string;
  username?: string;
  quota: number;
  active: boolean;
  spamf: boolean;
  setup_mailbox?: boolean;
  move_mailbox?: boolean;
  vhost?: {
    id: number;
    domain: string;
  };
}

interface VmailFormProps {
  vmail?: Vmail;
  vhosts: Vhost[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  errors?: Record<string, string>;
}

export function VmailForm({ 
  vmail, 
  vhosts, 
  onSubmit, 
  onCancel, 
  isProcessing = false,
  errors = {}
}: VmailFormProps) {
  // Get username from email if editing
  let username = '';
  if (vmail?.user) {
    const emailParts = vmail.user.split('@');
    username = emailParts[0];
  } else if (vmail?.username) {
    username = vmail.username;
  }

  // Set default values for a new vmail or use existing vmail data
  const defaultValues = vmail ? {
    hid: vmail.hid,
    username: username,
    password: '',
    password_confirmation: '',
    quota: vmail.quota,
    active: vmail.active,
    spamf: vmail.spamf,
    setup_mailbox: vmail.setup_mailbox || false,
    move_mailbox: vmail.move_mailbox || true,
  } : {
    hid: vhosts.length > 0 ? vhosts[0].id : 0,
    username: '',
    password: '',
    password_confirmation: '',
    quota: 500000000, // 500MB default
    active: true,
    spamf: true,
    setup_mailbox: true,
  };

  const { data, setData } = useForm(defaultValues);

  // Set selected domain when vhost changes
  const selectedVhost = vhosts.find((vhost) => vhost.id === Number(data.hid));
  const domain = selectedVhost ? selectedVhost.domain : '';
  
  // Check if domain is changing during edit
  const originalDomain = vmail?.vhost?.domain;
  const domainChanged = vmail && selectedVhost && originalDomain && originalDomain !== domain;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hid">Domain</Label>
            <Select
              value={data.hid ? data.hid.toString() : "0"}
              onValueChange={(value) => setData('hid', parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {vhosts.map((vhost) => (
                  <SelectItem key={vhost.id} value={vhost.id.toString()}>
                    {vhost.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hid && (
              <p className="text-red-500 text-sm mt-1">{errors.hid}</p>
            )}
            {domainChanged && (
              <p className="text-amber-500 text-sm mt-1">
                Warning: Changing domain will move all emails to the new domain.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center">
              <Input
                id="username"
                type="text"
                value={data.username}
                onChange={(e) => setData('username', e.target.value)}
                required
                className="rounded-r-none focus:z-10"
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400">
                @{domain}
              </span>
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">{vmail ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required={!vmail}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required={!vmail}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="quota">Mailbox Quota (bytes)</Label>
          <Input
            id="quota"
            type="number"
            min="0"
            step="1000000"
            value={data.quota}
            onChange={(e) => setData('quota', parseInt(e.target.value))}
            required
          />
          <p className="text-stone-500 text-sm mt-1 dark:text-stone-400">{formatBytes(data.quota)}</p>
          {errors.quota && (
            <p className="text-red-500 text-sm mt-1">{errors.quota}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={data.active}
              onCheckedChange={(checked) => setData('active', !!checked)}
            />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
            {errors.active && (
              <p className="text-red-500 text-sm mt-1">{errors.active}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="spamf"
              checked={data.spamf}
              onCheckedChange={(checked) => setData('spamf', !!checked)}
            />
            <Label htmlFor="spamf" className="cursor-pointer">Enable Spam Filter</Label>
            {errors.spamf && (
              <p className="text-red-500 text-sm mt-1">{errors.spamf}</p>
            )}
          </div>
        </div>

        {!vmail && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setup_mailbox"
              checked={data.setup_mailbox}
              onCheckedChange={(checked) => setData('setup_mailbox', !!checked)}
            />
            <Label htmlFor="setup_mailbox" className="cursor-pointer">
              Configure mailbox now (runs system setup)
            </Label>
          </div>
        )}

        {domainChanged && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="move_mailbox"
              checked={data.move_mailbox}
              onCheckedChange={(checked) => setData('move_mailbox', !!checked)}
            />
            <Label htmlFor="move_mailbox" className="cursor-pointer">
              Move mailbox contents to new domain (recommended)
            </Label>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {vmail ? 'Update Mailbox' : 'Create Mailbox'}
          </Button>
        </div>
      </div>
    </form>
  );
}