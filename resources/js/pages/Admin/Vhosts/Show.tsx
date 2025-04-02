import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft as ArrowLeftIcon, Edit as EditIcon, Trash as TrashIcon, Server as ServerIcon, RefreshCw as ArrowPathIcon, Shield as ShieldCheckIcon } from 'lucide-react';
import React from 'react';

interface Vhost {
  id: number;
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
  created_at: string;
  updated_at: string;
  account: {
    id: number;
    login: string;
  };
}

interface Props {
  vhost: Vhost;
  mailboxes_count: number;
  aliases_count: number;
}

export default function VhostShow({ vhost, mailboxes_count, aliases_count }: Props) {
  const confirmDelete = () => {
    if (confirm(`Are you sure you want to delete virtual host ${vhost.domain}? This will also remove all mailboxes and aliases associated with it.`)) {
      router.delete(route('admin.vhosts.destroy', vhost.id));
    }
  };

  const executeCommand = (command: string) => {
    if (confirm(`Are you sure you want to execute the ${command} command for ${vhost.domain}?`)) {
      router.post(route('admin.vhosts.execute', vhost.id), {
        command: command,
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
      title: vhost.domain,
      href: route('admin.vhosts.show', vhost.id),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{vhost.domain}</h1>
        <div className="flex space-x-2">
          <Link href={route('admin.vhosts.index')}>
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <Link href={route('admin.vhosts.edit', vhost.id)}>
            <Button>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Domain Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Status:</div>
              <div>
                <span 
                  className={`px-2 py-1 rounded text-xs ${vhost.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {vhost.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Account:</div>
              <div>
                <Link 
                  href={route('admin.accounts.show', vhost.account.id)}
                  className="text-blue-600 hover:underline"
                >
                  {vhost.account.login}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Domain:</div>
              <div>
                <a 
                  href={`https://${vhost.domain}`} 
                  target="_blank" 
                  className="text-blue-600 hover:underline"
                >
                  {vhost.domain}
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">System User:</div>
              <div>{vhost.uname} (UID: {vhost.uid}, GID: {vhost.gid})</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Created:</div>
              <div>{formatDate(vhost.created_at)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Last Updated:</div>
              <div>{formatDate(vhost.updated_at)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quotas and Limits</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Max Aliases:</div>
              <div>{vhost.aliases}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Current Aliases:</div>
              <div>
                {aliases_count} / {vhost.aliases}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (aliases_count / vhost.aliases) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Max Mailboxes:</div>
              <div>{vhost.mailboxes}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Current Mailboxes:</div>
              <div>
                {mailboxes_count} / {vhost.mailboxes}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (mailboxes_count / vhost.mailboxes) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Mail Quota:</div>
              <div>{formatBytes(vhost.mailquota)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Disk Quota:</div>
              <div>{formatBytes(vhost.diskquota)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Server Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => executeCommand('restart')}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Restart Services
            </Button>
            <Button onClick={() => executeCommand('status')}>
              <ServerIcon className="h-4 w-4 mr-2" />
              Check Status
            </Button>
            <Button onClick={() => executeCommand('fix_permissions')}>
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Fix Permissions
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Virtual Host
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Mailboxes</h2>
            <Link href={route('admin.vhosts.mailboxes', vhost.id)}>
              <Button variant="outline">Manage Mailboxes</Button>
            </Link>
          </div>
          <div>
            <div className="text-gray-500">Count: {mailboxes_count}</div>
            {mailboxes_count === 0 && (
              <p className="text-gray-500 mt-2">No mailboxes have been created for this domain yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Aliases</h2>
            <Link href={route('admin.vhosts.aliases', vhost.id)}>
              <Button variant="outline">Manage Aliases</Button>
            </Link>
          </div>
          <div>
            <div className="text-gray-500">Count: {aliases_count}</div>
            {aliases_count === 0 && (
              <p className="text-gray-500 mt-2">No aliases have been created for this domain yet.</p>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}