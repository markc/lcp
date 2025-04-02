import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft as ArrowLeftIcon, Edit as EditIcon, Trash as TrashIcon, Eraser as BroomIcon, RotateCcw as RotateCcwIcon, Check as CheckIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Vmail {
  id: number;
  user: string;
  quota: number;
  home: string;
  active: boolean;
  spamf: boolean;
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

interface UsageStats {
  total: number;
  inbox: number;
  spam: number;
  sent: number;
}

interface Props {
  vmail: Vmail;
  usageStats: UsageStats;
}

export default function VmailShow({ vmail, usageStats }: Props) {
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  
  // Show toast notifications for flash messages
  const page = usePage<{
      flash: {
          success?: string;
          error?: string;
      }
  }>();
  
  // Show toast notifications on initial load
  useEffect(() => {
      // Get the flash messages from the page props
      const flash = page.props.flash || {};
      const successMessage = flash.success;
      const errorMessage = flash.error;
      
      if (successMessage) {
          toast({
              title: "Success",
              description: successMessage,
              variant: "success",
          });
      }
      
      if (errorMessage) {
          toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
          });
      }
      
      // Listen for Inertia page visits to show toast notifications
      const handleSuccess = (event: CustomEvent) => {
          const flash = event?.detail?.page?.props?.flash;
          if (!flash) return;
          
          if (flash.success) {
              toast({
                  title: "Success",
                  description: flash.success,
                  variant: "success",
              });
          }
          
          if (flash.error) {
              toast({
                  title: "Error",
                  description: flash.error,
                  variant: "destructive",
              });
          }
      };
      
      document.addEventListener('inertia:success', handleSuccess);
      
      return () => {
          document.removeEventListener('inertia:success', handleSuccess);
      };
  }, [page.props.flash, toast]);

  const handleDelete = () => {
    router.delete(route('admin.vmails.destroy', vmail.id), {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Mailbox ${vmail.user} deleted successfully.`,
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete mailbox.",
          variant: "destructive",
        });
      },
    });
  };

  const executeCommand = (command: string) => {
    setSelectedCommand(command);
    setIsCommandModalOpen(true);
  };
  
  const handleCommandConfirm = () => {
    if (!selectedCommand) return;
    
    router.post(route('admin.vmails.execute', vmail.id), {
      command: selectedCommand,
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Command executed for ${vmail.user} successfully.`,
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to execute command.",
          variant: "destructive",
        });
      },
    });
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

  const usagePercent = (usageStats.total / vmail.quota) * 100;
  
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
      title: vmail.user,
      href: route('admin.vmails.show', vmail.id),
    },
  ];

  // Map command names to display names
  const commandDisplayNames: Record<string, string> = {
    'clear_spam': 'Clear Spam Folder',
    'rebuild': 'Rebuild Mailbox',
    'check': 'Check Mailbox',
    'quota_reset': 'Reset Quota',
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{vmail.user}</h1>
        <div className="flex space-x-2">
          <Link href={route('admin.vmails.index')}>
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
          <Link href={route('admin.vmails.edit', vmail.id)}>
            <Button>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Mailbox Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Status:</div>
              <div>
                <span 
                  className={`px-2 py-1 rounded text-xs ${vmail.active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}
                >
                  {vmail.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Spam Filter:</div>
              <div>
                <span 
                  className={`px-2 py-1 rounded text-xs ${vmail.spamf 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}
                >
                  {vmail.spamf ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Domain:</div>
              <div>
                <Link 
                  href={route('admin.vhosts.show', vmail.vhost.id)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {vmail.vhost.domain}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Account Owner:</div>
              <div>
                <Link 
                  href={route('admin.accounts.show', vmail.account.id)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {vmail.account.login}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Mail Directory:</div>
              <div className="break-words dark:text-stone-300">{vmail.home}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Created:</div>
              <div className="dark:text-stone-300">{formatDate(vmail.created_at)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-stone-500 dark:text-stone-400">Last Updated:</div>
              <div className="dark:text-stone-300">{formatDate(vmail.updated_at)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Storage Usage</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="dark:text-stone-300">Quota Usage: {formatBytes(usageStats.total)} of {formatBytes(vmail.quota)}</span>
                <span className={usagePercent > 90 
                  ? 'text-red-500 dark:text-red-400' 
                  : (usagePercent > 70 
                  ? 'text-amber-500 dark:text-amber-400' 
                  : 'text-green-500 dark:text-green-400')}>
                  {usagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    usagePercent > 90 
                    ? 'bg-red-500' 
                    : (usagePercent > 70 
                    ? 'bg-amber-500' 
                    : 'bg-green-500')
                  }`} 
                  style={{ width: `${Math.min(100, usagePercent)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-stone-300">Storage Breakdown</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-stone-500 dark:text-stone-400">Inbox:</div>
                <div className="dark:text-stone-300">{formatBytes(usageStats.inbox)}</div>
                
                <div className="text-stone-500 dark:text-stone-400">Spam Folder:</div>
                <div className="dark:text-stone-300">{formatBytes(usageStats.spam)}</div>
                
                <div className="text-stone-500 dark:text-stone-400">Sent Items:</div>
                <div className="dark:text-stone-300">{formatBytes(usageStats.sent)}</div>
                
                <div className="text-stone-500 dark:text-stone-400">Total Size:</div>
                <div className="font-semibold dark:text-stone-300">{formatBytes(usageStats.total)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-stone-300">Mailbox Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => executeCommand('clear_spam')}>
              <BroomIcon className="h-4 w-4 mr-2" />
              Clear Spam Folder
            </Button>
            <Button onClick={() => executeCommand('rebuild')}>
              <RotateCcwIcon className="h-4 w-4 mr-2" />
              Rebuild Mailbox
            </Button>
            <Button onClick={() => executeCommand('check')}>
              <CheckIcon className="h-4 w-4 mr-2" />
              Check Mailbox
            </Button>
            <Button onClick={() => executeCommand('quota_reset')}>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Reset Quota
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Mailbox
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Mailbox"
        description={`Are you sure you want to delete the mailbox ${vmail.user}? This will also remove all emails in this mailbox. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
      
      {/* Command Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
        onConfirm={handleCommandConfirm}
        title="Execute Mailbox Command"
        description={`Are you sure you want to execute the ${selectedCommand ? commandDisplayNames[selectedCommand] : ''} command for ${vmail.user}?`}
        confirmText="Execute"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </AppLayout>
  );
}