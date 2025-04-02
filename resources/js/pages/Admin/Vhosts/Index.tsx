import { VhostsTable } from '@/components/VhostsTable';
import { VhostForm } from '@/components/VhostForm';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Account {
  id: number;
  login: string;
}

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
  account: {
    id: number;
    login: string;
  };
  updated_at: string;
}

interface Props {
  vhosts: {
    data: Vhost[];
    links: { url: string | null; label: string }[];
    total: number;
  };
  accounts: Account[];
  errors?: Record<string, string>;
}

export default function VhostsIndex({ vhosts = { data: [], links: [], total: 0 }, accounts = [], errors = {} }: Props) {
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVhost, setSelectedVhost] = useState<Vhost | null>(null);
    const [processing, setProcessing] = useState(false);
    
    // Confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vhostToDelete, setVhostToDelete] = useState<{ id: number, domain: string } | null>(null);
    
    // Multiple delete confirmation state
    const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
    const [vhostsToDelete, setVhostsToDelete] = useState<number[]>([]);
    
    const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
    const [vhostForCommand, setVhostForCommand] = useState<{ id: number, domain: string, command: string } | null>(null);

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

    const confirmDelete = (id: number, domain: string) => {
        setVhostToDelete({ id, domain });
        setIsDeleteModalOpen(true);
    };
    
    const handleDeleteConfirm = () => {
        if (vhostToDelete) {
            router.delete(route('admin.vhosts.destroy', vhostToDelete.id), {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: `Virtual host ${vhostToDelete.domain} deleted successfully.`,
                        variant: "success",
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to delete virtual host.",
                        variant: "destructive",
                    });
                },
            });
        }
    };
    
    const confirmDeleteMultiple = (ids: number[]) => {
        setVhostsToDelete(ids);
        setIsMultiDeleteModalOpen(true);
    };
    
    const handleMultiDeleteConfirm = () => {
        if (vhostsToDelete.length > 0) {
            router.post(route('admin.vhosts.destroyMultiple'), { ids: vhostsToDelete }, {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: `${vhostsToDelete.length} virtual hosts deleted successfully.`,
                        variant: "success",
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to delete virtual hosts.",
                        variant: "destructive",
                    });
                },
            });
        }
    };

    const executeCommand = (id: number, command: string, domain: string) => {
        setVhostForCommand({ id, domain, command });
        setIsCommandModalOpen(true);
    };
    
    const handleCommandConfirm = () => {
        if (vhostForCommand) {
            router.post(route('admin.vhosts.execute', vhostForCommand.id), {
                command: vhostForCommand.command,
            }, {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: `Command executed for ${vhostForCommand.domain} successfully.`,
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
        }
    };

    const openEditModal = (vhost: Vhost) => {
        setSelectedVhost(vhost);
        setIsEditModalOpen(true);
    };

    const handleCreateSubmit = (data: Record<string, unknown>) => {
        setProcessing(true);
        router.post(route('admin.vhosts.store'), data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setProcessing(false);
                toast({
                    title: "Success",
                    description: "Virtual host created successfully.",
                    variant: "success",
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: "Error",
                    description: "Failed to create virtual host. Please check the form for errors.",
                    variant: "destructive",
                });
            },
        });
    };

    const handleEditSubmit = (data: Record<string, unknown>) => {
        if (!selectedVhost) return;
        
        setProcessing(true);
        router.put(route('admin.vhosts.update', selectedVhost.id), data, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedVhost(null);
                setProcessing(false);
                toast({
                    title: "Success",
                    description: "Virtual host updated successfully.",
                    variant: "success",
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: "Error",
                    description: "Failed to update virtual host. Please check the form for errors.",
                    variant: "destructive",
                });
            },
        });
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
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="my-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Virtual Hosts</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Virtual Host
                </Button>
            </div>

            <Card className="p-6">
                <div className="overflow-x-auto">
                    {vhosts.data && vhosts.data.length > 0 ? (
                        <VhostsTable 
                            vhosts={vhosts.data} 
                            onDelete={confirmDelete}
                            onDeleteSelected={confirmDeleteMultiple}
                            onExecuteCommand={executeCommand}
                            onEdit={openEditModal} 
                        />
                    ) : (
                        <div className="py-10 text-center">
                            <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300">No virtual hosts found</h3>
                            <p className="mt-2 text-stone-500 dark:text-stone-400">Get started by creating your first virtual host</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Virtual Host
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Virtual Host Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="create-vhost-form">
                    <DialogHeader>
                        <DialogTitle>Create Virtual Host</DialogTitle>
                        <DialogDescription>
                            Fill in the form to create a new virtual host
                        </DialogDescription>
                    </DialogHeader>
                    <div id="create-vhost-form">
                        <VhostForm 
                            accounts={accounts} 
                            onSubmit={handleCreateSubmit} 
                            onCancel={() => setIsCreateModalOpen(false)}
                            isProcessing={processing}
                            errors={errors}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Virtual Host Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="edit-vhost-form">
                    <DialogHeader>
                        <DialogTitle>Edit Virtual Host</DialogTitle>
                        <DialogDescription>
                            Update the virtual host information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVhost && (
                        <div id="edit-vhost-form">
                            <VhostForm 
                                vhost={selectedVhost}
                                accounts={accounts} 
                                onSubmit={handleEditSubmit} 
                                onCancel={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedVhost(null);
                                }}
                                isProcessing={processing}
                                errors={errors}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Virtual Host"
                description={`Are you sure you want to delete ${vhostToDelete?.domain}? This will also remove all mailboxes and aliases associated with it. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
            />
            
            {/* Multiple Delete Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isMultiDeleteModalOpen}
                onClose={() => setIsMultiDeleteModalOpen(false)}
                onConfirm={handleMultiDeleteConfirm}
                title="Delete Multiple Virtual Hosts"
                description={`Are you sure you want to delete ${vhostsToDelete.length} selected virtual hosts? This will also remove all mailboxes and aliases associated with them. This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                confirmVariant="destructive"
            />
            
            {/* Command Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isCommandModalOpen}
                onClose={() => setIsCommandModalOpen(false)}
                onConfirm={handleCommandConfirm}
                title="Execute Server Command"
                description={`Are you sure you want to execute the ${vhostForCommand?.command} command for ${vhostForCommand?.domain}?`}
                confirmText="Execute"
                cancelText="Cancel"
                confirmVariant="default"
            />
        </AppLayout>
    );
}