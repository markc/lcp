import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValiasForm } from '@/components/ValiasForm';
import { ValiasTable } from '@/components/ValiasTable';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
}

interface Vhost {
    id: number;
    domain: string;
}

interface Mailbox {
    id: number;
    user: string;
}

interface Props {
    aliases: {
        data: Valias[];
        links: { url: string | null; label: string }[];
        total: number;
    };
    vhosts: Vhost[];
    mailboxes?: Mailbox[];
    filters: {
        search: string;
        active: string | null;
        vhost_id: number | null;
        vhost_domain: string | null;
    };
    errors?: Record<string, string>;
}

export default function ValiasIndex({
    aliases = { data: [], links: [], total: 0 },
    vhosts = [],
    mailboxes = [],
    filters = { search: '', active: null, vhost_id: null, vhost_domain: null },
    errors = {},
}: Props) {
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedValias, setSelectedValias] = useState<Valias | null>(null);
    const [processing, setProcessing] = useState(false);

    // Filter state
    const { data, setData, get } = useForm({
        search: filters.search || '',
        vhost_id: filters.vhost_id || '',
        active: filters.active || '',
    });

    // Confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [aliasToDelete, setAliasToDelete] = useState<{ id: number; source: string; domain: string } | null>(null);

    // Multiple delete confirmation state
    const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
    const [aliasesToDelete, setAliasesToDelete] = useState<number[]>([]);

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
        get(route('admin.valias.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const confirmDelete = (id: number, source: string, domain: string) => {
        setAliasToDelete({ id, source, domain });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (aliasToDelete) {
            router.delete(route('admin.valias.destroy', aliasToDelete.id), {
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: `Alias ${aliasToDelete.source}@${aliasToDelete.domain} deleted successfully.`,
                        variant: 'success',
                    });
                },
                onError: () => {
                    toast({
                        title: 'Error',
                        description: 'Failed to delete mail alias.',
                        variant: 'destructive',
                    });
                },
            });
        }
    };

    const confirmDeleteMultiple = (ids: number[]) => {
        setAliasesToDelete(ids);
        setIsMultiDeleteModalOpen(true);
    };

    const handleMultiDeleteConfirm = () => {
        if (aliasesToDelete.length > 0) {
            router.post(
                route('admin.valias.destroyMultiple'),
                { ids: aliasesToDelete },
                {
                    onSuccess: () => {
                        // Reset state gets handled by the redirect
                    },
                    onError: () => {
                        toast({
                            title: 'Error',
                            description: 'Failed to delete aliases.',
                            variant: 'destructive',
                        });
                    },
                },
            );
        }
    };

    const openEditModal = (valias: Valias) => {
        setSelectedValias(valias);
        setIsEditModalOpen(true);
    };

    const handleCreateSubmit = (data: Record<string, unknown>) => {
        setProcessing(true);
        router.post(route('admin.valias.store'), data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setProcessing(false);
                toast({
                    title: 'Success',
                    description: 'Mail alias created successfully.',
                    variant: 'success',
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: 'Error',
                    description: 'Failed to create mail alias. Please check the form for errors.',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleEditSubmit = (data: Record<string, unknown>) => {
        if (!selectedValias) return;

        setProcessing(true);
        router.put(route('admin.valias.update', selectedValias.id), data, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedValias(null);
                setProcessing(false);
                toast({
                    title: 'Success',
                    description: 'Mail alias updated successfully.',
                    variant: 'success',
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: 'Error',
                    description: 'Failed to update mail alias. Please check the form for errors.',
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
            title: filters.vhost_domain ? `Aliases - ${filters.vhost_domain}` : 'Mail Aliases',
            href: filters.vhost_id ? route('admin.vhosts.aliases', filters.vhost_id) : route('admin.valias.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="my-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-2xl font-bold">{filters.vhost_domain ? `Aliases for ${filters.vhost_domain}` : 'All Mail Aliases'}</h1>

                {/* Filter and search controls */}
                <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                    <div className="flex flex-1 gap-2">
                        <Select
                            value={data.vhost_id ? data.vhost_id.toString() : '0'}
                            onValueChange={(value) => {
                                setData('vhost_id', value);
                                if (value && value !== '0') {
                                    router.get(route('admin.vhosts.aliases', value));
                                } else {
                                    router.get(route('admin.valias.index'));
                                }
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
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

                        <Select
                            value={data.active || 'all'}
                            onValueChange={(value) => {
                                setData('active', value === 'all' ? '' : value);
                                get(route('admin.valias.index'), {
                                    preserveState: true,
                                    replace: true,
                                });
                            }}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="1">Active Only</SelectItem>
                                <SelectItem value="0">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search aliases..."
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Alias
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="overflow-x-auto">
                    {aliases.data && aliases.data.length > 0 ? (
                        <ValiasTable
                            aliases={aliases.data}
                            onDelete={confirmDelete}
                            onDeleteSelected={confirmDeleteMultiple}
                            onEdit={openEditModal}
                        />
                    ) : (
                        <div className="py-10 text-center">
                            <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300">No mail aliases found</h3>
                            <p className="mt-2 text-stone-500 dark:text-stone-400">
                                {filters.search && <span>Try a different search term, or </span>}
                                {filters.vhost_domain && <span>Create an alias for {filters.vhost_domain}, or </span>}
                                Get started by creating your first mail alias
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Mail Alias
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Mail Alias Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="create-valias-form">
                    <DialogHeader>
                        <DialogTitle>Create Mail Alias</DialogTitle>
                        <DialogDescription>Fill in the form to create a new mail alias</DialogDescription>
                    </DialogHeader>
                    <div id="create-valias-form">
                        <ValiasForm
                            vhosts={vhosts}
                            mailboxes={mailboxes}
                            onSubmit={handleCreateSubmit}
                            onCancel={() => setIsCreateModalOpen(false)}
                            isProcessing={processing}
                            errors={errors}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Mail Alias Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[800px]" aria-describedby="edit-valias-form">
                    <DialogHeader>
                        <DialogTitle>Edit Mail Alias</DialogTitle>
                        <DialogDescription>Update the mail alias information</DialogDescription>
                    </DialogHeader>
                    {selectedValias && (
                        <div id="edit-valias-form">
                            <ValiasForm
                                valias={selectedValias}
                                vhosts={vhosts}
                                mailboxes={mailboxes}
                                onSubmit={handleEditSubmit}
                                onCancel={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedValias(null);
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
                title="Delete Mail Alias"
                description={`Are you sure you want to delete the mail alias ${aliasToDelete ? `${aliasToDelete.source}@${aliasToDelete.domain}` : ''}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
            />

            {/* Multiple Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isMultiDeleteModalOpen}
                onClose={() => setIsMultiDeleteModalOpen(false)}
                onConfirm={handleMultiDeleteConfirm}
                title="Delete Multiple Mail Aliases"
                description={`Are you sure you want to delete ${aliasesToDelete.length} mail aliases? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                confirmVariant="destructive"
            />
        </AppLayout>
    );
}
