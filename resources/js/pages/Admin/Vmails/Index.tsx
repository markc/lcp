import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VmailForm } from '@/components/VmailForm';
import { VmailsTable } from '@/components/VmailsTable';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Vmail {
    id: number;
    user: string;
    quota: number;
    active: boolean;
    spamf: boolean;
    created_at: string;
    updated_at: string;
    vhost: {
        id: number;
        domain: string;
    };
}

interface Vhost {
    id: number;
    domain: string;
}

interface Props {
    vmails: {
        data: Vmail[];
        links: { url: string | null; label: string }[];
        total: number;
    };
    vhosts: Vhost[];
    filters: {
        search: string;
        vhost_id: number | null;
        vhost_domain: string | null;
    };
    errors?: Record<string, string>;
}

export default function VmailsIndex({
    vmails = { data: [], links: [], total: 0 },
    vhosts = [],
    filters = { search: '', vhost_id: null, vhost_domain: null },
    errors = {},
}: Props) {
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVmail, setSelectedVmail] = useState<Vmail | null>(null);
    const [processing, setProcessing] = useState(false);

    // Filter state
    const { data, setData, get } = useForm({
        search: filters.search || '',
        vhost_id: filters.vhost_id || '',
    });

    // Confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vmailToDelete, setVmailToDelete] = useState<{ id: number; email: string } | null>(null);

    // Multiple delete confirmation state
    const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
    const [vmailsToDelete, setVmailsToDelete] = useState<number[]>([]);

    const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
    const [vmailForCommand, setVmailForCommand] = useState<{ id: number; email: string; command: string } | null>(null);

    // Show toast notifications for flash messages
    const page = usePage<{
        flash: {
            success?: string;
            error?: string;
        };
    }>();

    // Show toast notifications on initial load
    useEffect(() => {
        // Get the flash messages from the page props
        const flash = page.props.flash || {};
        const successMessage = flash.success;
        const errorMessage = flash.error;

        if (successMessage) {
            toast({
                title: 'Success',
                description: successMessage,
                variant: 'success',
            });
        }

        if (errorMessage) {
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }

        // Listen for Inertia page visits to show toast notifications
        const handleSuccess = (event: CustomEvent) => {
            const flash = event?.detail?.page?.props?.flash;
            if (!flash) return;

            if (flash.success) {
                toast({
                    title: 'Success',
                    description: flash.success,
                    variant: 'success',
                });
            }

            if (flash.error) {
                toast({
                    title: 'Error',
                    description: flash.error,
                    variant: 'destructive',
                });
            }
        };

        document.addEventListener('inertia:success', handleSuccess);

        return () => {
            document.removeEventListener('inertia:success', handleSuccess);
        };
    }, [page.props.flash, toast]);

    const handleSearch = () => {
        get(route('admin.vmails.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const confirmDelete = (id: number, email: string) => {
        setVmailToDelete({ id, email });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (vmailToDelete) {
            router.delete(route('admin.vmails.destroy', vmailToDelete.id), {
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: `Mailbox ${vmailToDelete.email} deleted successfully.`,
                        variant: 'success',
                    });
                },
                onError: () => {
                    toast({
                        title: 'Error',
                        description: 'Failed to delete mailbox.',
                        variant: 'destructive',
                    });
                },
            });
        }
    };

    const confirmDeleteMultiple = (ids: number[]) => {
        setVmailsToDelete(ids);
        setIsMultiDeleteModalOpen(true);
    };

    const handleMultiDeleteConfirm = () => {
        if (vmailsToDelete.length > 0) {
            router.post(
                route('admin.vmails.destroyMultiple'),
                { ids: vmailsToDelete },
                {
                    onSuccess: () => {
                        toast({
                            title: 'Success',
                            description: `${vmailsToDelete.length} mailboxes deleted successfully.`,
                            variant: 'success',
                        });
                    },
                    onError: () => {
                        toast({
                            title: 'Error',
                            description: 'Failed to delete mailboxes.',
                            variant: 'destructive',
                        });
                    },
                },
            );
        }
    };

    const executeCommand = (id: number, command: string, email: string) => {
        setVmailForCommand({ id, email, command });
        setIsCommandModalOpen(true);
    };

    const handleCommandConfirm = () => {
        if (vmailForCommand) {
            router.post(
                route('admin.vmails.execute', vmailForCommand.id),
                {
                    command: vmailForCommand.command,
                },
                {
                    onSuccess: () => {
                        toast({
                            title: 'Success',
                            description: `Command executed for ${vmailForCommand.email} successfully.`,
                            variant: 'success',
                        });
                    },
                    onError: () => {
                        toast({
                            title: 'Error',
                            description: 'Failed to execute command.',
                            variant: 'destructive',
                        });
                    },
                },
            );
        }
    };

    const openEditModal = (vmail: Vmail) => {
        setSelectedVmail(vmail);
        setIsEditModalOpen(true);
    };

    const handleCreateSubmit = (data: Record<string, unknown>) => {
        setProcessing(true);
        router.post(route('admin.vmails.store'), data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setProcessing(false);
                toast({
                    title: 'Success',
                    description: 'Mailbox created successfully.',
                    variant: 'success',
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: 'Error',
                    description: 'Failed to create mailbox. Please check the form for errors.',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleEditSubmit = (data: Record<string, unknown>) => {
        if (!selectedVmail) return;

        setProcessing(true);
        router.put(route('admin.vmails.update', selectedVmail.id), data, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedVmail(null);
                setProcessing(false);
                toast({
                    title: 'Success',
                    description: 'Mailbox updated successfully.',
                    variant: 'success',
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: 'Error',
                    description: 'Failed to update mailbox. Please check the form for errors.',
                    variant: 'destructive',
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
            title: filters.vhost_domain ? `Mailboxes - ${filters.vhost_domain}` : 'Mailboxes',
            href: filters.vhost_id ? route('admin.vhosts.mailboxes', filters.vhost_id) : route('admin.vmails.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="my-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-2xl font-bold">{filters.vhost_domain ? `Mailboxes for ${filters.vhost_domain}` : 'All Mailboxes'}</h1>

                {/* Filter and search controls */}
                <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                    <div className="flex flex-1 gap-2">
                        <Select
                            value={data.vhost_id ? data.vhost_id.toString() : '0'}
                            onValueChange={(value) => {
                                setData('vhost_id', value);
                                setData('search', '');
                                if (value && value !== '0') {
                                    router.get(route('admin.vhosts.mailboxes', value));
                                } else {
                                    router.get(route('admin.vmails.index'));
                                }
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by domain" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">All Domains</SelectItem>
                                {vhosts.map((vhost) => (
                                    <SelectItem key={vhost.id} value={vhost.id.toString()}>
                                        {vhost.domain}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search mailboxes..."
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Mailbox
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="overflow-x-auto">
                    {vmails.data && vmails.data.length > 0 ? (
                        <VmailsTable
                            vmails={vmails.data}
                            onDelete={confirmDelete}
                            onDeleteSelected={confirmDeleteMultiple}
                            onExecuteCommand={executeCommand}
                            onEdit={openEditModal}
                        />
                    ) : (
                        <div className="py-10 text-center">
                            <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300">No mailboxes found</h3>
                            <p className="mt-2 text-stone-500 dark:text-stone-400">
                                {filters.search && <span>Try a different search term, or </span>}
                                {filters.vhost_domain && <span>Create a mailbox for {filters.vhost_domain}, or </span>}
                                Get started by creating your first mailbox
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Mailbox
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Mailbox Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="create-vmail-form">
                    <DialogHeader>
                        <DialogTitle>Create Mailbox</DialogTitle>
                        <DialogDescription>Fill in the form to create a new mailbox</DialogDescription>
                    </DialogHeader>
                    <div id="create-vmail-form">
                        <VmailForm
                            vhosts={vhosts}
                            onSubmit={handleCreateSubmit}
                            onCancel={() => setIsCreateModalOpen(false)}
                            isProcessing={processing}
                            errors={errors}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Mailbox Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="edit-vmail-form">
                    <DialogHeader>
                        <DialogTitle>Edit Mailbox</DialogTitle>
                        <DialogDescription>Update the mailbox information</DialogDescription>
                    </DialogHeader>
                    {selectedVmail && (
                        <div id="edit-vmail-form">
                            <VmailForm
                                vmail={selectedVmail}
                                vhosts={vhosts}
                                onSubmit={handleEditSubmit}
                                onCancel={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedVmail(null);
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
                title="Delete Mailbox"
                description={`Are you sure you want to delete the mailbox ${vmailToDelete?.email}? This will also remove all emails in this mailbox. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
            />

            {/* Multiple Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isMultiDeleteModalOpen}
                onClose={() => setIsMultiDeleteModalOpen(false)}
                onConfirm={handleMultiDeleteConfirm}
                title="Delete Multiple Mailboxes"
                description={`Are you sure you want to delete ${vmailsToDelete.length} selected mailboxes? This will also remove all emails in these mailboxes. This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                confirmVariant="destructive"
            />

            {/* Command Confirmation Modal */}
            <ConfirmationModal
                isOpen={isCommandModalOpen}
                onClose={() => setIsCommandModalOpen(false)}
                onConfirm={handleCommandConfirm}
                title="Execute Mailbox Command"
                description={`Are you sure you want to execute the ${vmailForCommand?.command} command for ${vmailForCommand?.email}?`}
                confirmText="Execute"
                cancelText="Cancel"
                confirmVariant="default"
            />
        </AppLayout>
    );
}
