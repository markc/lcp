import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeftIcon, EditIcon, TrashIcon, MailIcon } from 'lucide-react';
import React from 'react';

interface Valias {
  id: number;
  source: string;
  target: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  vhost: {
    id: number;
    domain: string;
  };
  account: {
    id: number;
    login: string;
  };
}

interface Props {
  valias: Valias;
}

export default function ValiasShow({ valias }: Props) {
  const confirmDelete = () => {
    if (confirm(`Are you sure you want to delete the alias ${valias.source}@${valias.vhost.domain}?`)) {
      router.delete(route('admin.valias.destroy', valias.id));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const fullSource = `${valias.source}@${valias.vhost.domain}`;
  const isLocalTarget = valias.target.includes('@') && valias.target.endsWith(valias.vhost.domain);
  
  const breadcrumbs = [
    {
      title: 'Dashboard',
      href: route('dashboard'),
    },
    {
      title: 'Mail Aliases',
      href: route('admin.valias.index'),
    },
    {
      title: fullSource,
      href: route('admin.valias.show', valias.id),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{fullSource}</h1>
        <div className="flex space-x-2">
          <Link href={route('admin.valias.index')}>
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <Link href={route('admin.valias.edit', valias.id)}>
            <Button>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Alias Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 mb-1">Source Address:</div>
                <div className="text-lg font-medium">{fullSource}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Status:</div>
                <div>
                  <span 
                    className={`px-2 py-1 rounded text-xs ${valias.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {valias.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-gray-500 mb-1">Target Destination:</div>
              <div className="text-lg font-medium break-all">
                {valias.target}
                {isLocalTarget && (
                  <span className="ml-2 text-sm text-green-600">(Local Mailbox)</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 mb-1">Domain:</div>
                <div>
                  <Link 
                    href={route('admin.vhosts.show', valias.vhost.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {valias.vhost.domain}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Account Owner:</div>
                <div>
                  <Link 
                    href={route('admin.accounts.show', valias.account.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {valias.account.login}
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 mb-1">Created:</div>
                <div>{formatDate(valias.created_at)}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Last Updated:</div>
                <div>{formatDate(valias.updated_at)}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t mt-6">
              <h3 className="text-lg font-semibold mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {isLocalTarget && (
                  <Link href={route('admin.vmails.index', { search: valias.target })}>
                    <Button variant="outline">
                      <MailIcon className="h-4 w-4 mr-2" />
                      View Target Mailbox
                    </Button>
                  </Link>
                )}
                <Button variant="destructive" onClick={confirmDelete}>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Alias
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}