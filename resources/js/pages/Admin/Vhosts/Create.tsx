import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import React from 'react';

interface Account {
  id: number;
  login: string;
}

interface Props {
  accounts: Account[];
}

export default function VhostCreate({ accounts }: Props) {
  const { data, setData, errors, post, processing } = useForm({
    aid: accounts.length > 0 ? accounts[0].id : '',
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.vhosts.store'));
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      href: route('dashboard'),
    },
    {
      title: 'Virtual Hosts',
      href: route('admin.vhosts.index'),
    },
    {
      title: 'Create',
      href: route('admin.vhosts.create'),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Virtual Host</h1>
        <Link href={route('admin.vhosts.index')}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aid">Account</Label>
                <Select
                  id="aid"
                  value={data.aid.toString()}
                  onValueChange={(value) => setData('aid', parseInt(value))}
                  required
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.login}
                    </option>
                  ))}
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
                <p className="text-gray-500 text-sm mt-1">{formatBytes(data.mailquota)}</p>
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
                <p className="text-gray-500 text-sm mt-1">{formatBytes(data.diskquota)}</p>
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
                  onCheckedChange={(checked) => setData('active', checked as boolean)}
                />
                <Label htmlFor="active" className="cursor-pointer">Active</Label>
                {errors.active && (
                  <p className="text-red-500 text-sm mt-1">{errors.active}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="configure_domain"
                  checked={data.configure_domain}
                  onCheckedChange={(checked) => setData('configure_domain', checked as boolean)}
                />
                <Label htmlFor="configure_domain" className="cursor-pointer">
                  Configure domain now (runs system setup)
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={processing}>
                Create Virtual Host
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}