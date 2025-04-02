import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface Vhost {
  id: number;
  domain: string;
}

interface Props {
  vhosts: Vhost[];
  preselectedVhostId?: number | string;
}

export default function VmailCreate({ vhosts, preselectedVhostId }: Props) {
  const { data, setData, errors, post, processing } = useForm({
    hid: preselectedVhostId || (vhosts.length > 0 ? vhosts[0].id : ''),
    username: '',
    password: '',
    password_confirmation: '',
    quota: 500000000, // 500MB default
    active: true,
    spamf: true,
    setup_mailbox: true,
  });

  // Set selected domain when vhost changes
  const selectedVhost = vhosts.find((vhost) => vhost.id === Number(data.hid));
  const domain = selectedVhost ? selectedVhost.domain : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.vmails.store'));
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      href: route('dashboard'),
    },
    {
      title: 'Mailboxes',
      href: route('admin.vmails.index'),
    },
    {
      title: 'Create',
      href: route('admin.vmails.create'),
    },
  ];

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Mailbox</h1>
        <Link href={route('admin.vmails.index')}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hid">Domain</Label>
                <Select
                  id="hid"
                  value={data.hid.toString()}
                  onValueChange={(value) => setData('hid', parseInt(value))}
                  required
                >
                  {vhosts.map((vhost) => (
                    <option key={vhost.id} value={vhost.id.toString()}>
                      {vhost.domain}
                    </option>
                  ))}
                </Select>
                {errors.hid && (
                  <p className="text-red-500 text-sm mt-1">{errors.hid}</p>
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
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  required
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
                  required
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
              <p className="text-gray-500 text-sm mt-1">{formatBytes(data.quota)}</p>
              {errors.quota && (
                <p className="text-red-500 text-sm mt-1">{errors.quota}</p>
              )}
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
                  id="spamf"
                  checked={data.spamf}
                  onCheckedChange={(checked) => setData('spamf', checked as boolean)}
                />
                <Label htmlFor="spamf" className="cursor-pointer">Enable Spam Filter</Label>
                {errors.spamf && (
                  <p className="text-red-500 text-sm mt-1">{errors.spamf}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="setup_mailbox"
                checked={data.setup_mailbox}
                onCheckedChange={(checked) => setData('setup_mailbox', checked as boolean)}
              />
              <Label htmlFor="setup_mailbox" className="cursor-pointer">
                Configure mailbox now (runs system setup)
              </Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={processing}>
                Create Mailbox
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}