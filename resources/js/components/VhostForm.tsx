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

interface Account {
  id: number;
  login: string;
}

interface Vhost {
  id?: number;
  aid: number;
  domain: string;
  uname: string;
  uid: number;
  gid: number;
  aliases: number;
  mailboxes: number;
  mailquota: number;
  diskquota: number;
  active: boolean;
  configure_domain?: boolean;
}

interface VhostFormProps {
  vhost?: Vhost;
  accounts: Account[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  errors?: Record<string, string>;
}

export function VhostForm({ 
  vhost, 
  accounts, 
  onSubmit, 
  onCancel, 
  isProcessing = false,
  errors = {}
}: VhostFormProps) {
  // Set default values for a new vhost or use existing vhost data
  const defaultValues = vhost ? {
    aid: vhost.aid,
    domain: vhost.domain,
    uname: vhost.uname,
    uid: vhost.uid,
    gid: vhost.gid,
    aliases: vhost.aliases,
    mailboxes: vhost.mailboxes,
    mailquota: vhost.mailquota,
    diskquota: vhost.diskquota,
    active: vhost.active,
    configure_domain: vhost.configure_domain || false,
  } : {
    aid: accounts.length > 0 ? accounts[0].id : 0,
    domain: '',
    uname: 'www-data',
    uid: 33, // Default for www-data on most systems
    gid: 33, // Default for www-data on most systems
    aliases: 50,
    mailboxes: 50,
    mailquota: 1000000000, // 1GB
    diskquota: 5000000000, // 5GB
    active: true,
    configure_domain: true,
  };

  const { data, setData } = useForm(defaultValues);

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
            <Label htmlFor="aid">Account</Label>
            <Select
              value={data.aid.toString()}
              onValueChange={(value) => setData('aid', parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.login}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.aid && (
              <p className="text-red-500 text-sm mt-1">{errors.aid}</p>
            )}
          </div>

          <div>
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              type="text"
              value={data.domain}
              onChange={(e) => setData('domain', e.target.value)}
              placeholder="example.com"
              required
            />
            {errors.domain && (
              <p className="text-red-500 text-sm mt-1">{errors.domain}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="uname">System Username</Label>
            <Input
              id="uname"
              type="text"
              value={data.uname}
              onChange={(e) => setData('uname', e.target.value)}
              required
            />
            {errors.uname && (
              <p className="text-red-500 text-sm mt-1">{errors.uname}</p>
            )}
          </div>

          <div>
            <Label htmlFor="uid">User ID</Label>
            <Input
              id="uid"
              type="number"
              min="1000"
              value={data.uid}
              onChange={(e) => setData('uid', parseInt(e.target.value))}
              required
            />
            {errors.uid && (
              <p className="text-red-500 text-sm mt-1">{errors.uid}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gid">Group ID</Label>
            <Input
              id="gid"
              type="number"
              min="1000"
              value={data.gid}
              onChange={(e) => setData('gid', parseInt(e.target.value))}
              required
            />
            {errors.gid && (
              <p className="text-red-500 text-sm mt-1">{errors.gid}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="aliases">Max Aliases</Label>
            <Input
              id="aliases"
              type="number"
              min="0"
              value={data.aliases}
              onChange={(e) => setData('aliases', parseInt(e.target.value))}
              required
            />
            {errors.aliases && (
              <p className="text-red-500 text-sm mt-1">{errors.aliases}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mailboxes">Max Mailboxes</Label>
            <Input
              id="mailboxes"
              type="number"
              min="0"
              value={data.mailboxes}
              onChange={(e) => setData('mailboxes', parseInt(e.target.value))}
              required
            />
            {errors.mailboxes && (
              <p className="text-red-500 text-sm mt-1">{errors.mailboxes}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mailquota">Mail Quota (bytes)</Label>
            <Input
              id="mailquota"
              type="number"
              min="0"
              value={data.mailquota}
              onChange={(e) => setData('mailquota', parseInt(e.target.value))}
              required
            />
            <p className="text-stone-500 text-sm mt-1 dark:text-stone-400">{formatBytes(data.mailquota)}</p>
            {errors.mailquota && (
              <p className="text-red-500 text-sm mt-1">{errors.mailquota}</p>
            )}
          </div>

          <div>
            <Label htmlFor="diskquota">Disk Quota (bytes)</Label>
            <Input
              id="diskquota"
              type="number"
              min="0"
              value={data.diskquota}
              onChange={(e) => setData('diskquota', parseInt(e.target.value))}
              required
            />
            <p className="text-stone-500 text-sm mt-1 dark:text-stone-400">{formatBytes(data.diskquota)}</p>
            {errors.diskquota && (
              <p className="text-red-500 text-sm mt-1">{errors.diskquota}</p>
            )}
          </div>
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

          {!vhost && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="configure_domain"
                checked={data.configure_domain}
                onCheckedChange={(checked) => setData('configure_domain', !!checked)}
              />
              <Label htmlFor="configure_domain" className="cursor-pointer">
                Configure domain now (runs system setup)
              </Label>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {vhost ? 'Update Virtual Host' : 'Create Virtual Host'}
          </Button>
        </div>
      </div>
    </form>
  );
}