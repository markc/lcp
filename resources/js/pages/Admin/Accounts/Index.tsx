import { AccountsTable } from '@/components/AccountsTable';
import { AccountForm } from '@/components/AccountForm';
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
    fname: string;
    lname: string;
    altemail: string | null;
    acl: number;
    grp: number;
    vhosts?: number;
    updated_at: string;
    created_at: string;
}

interface Props {
    accounts: {
        data: Account[];
        links: { url: string | null; label: string }[];
        total: number;
    };
    roles: Record<number, string>;
    errors?: Record<string, string>;
}

export default function AccountsIndex({ accounts = { data: [], links: [], total: 0 }, roles = {}, errors = {} }: Props) {
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [processing, setProcessing] = useState(false);
    
    // Confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<{ id: number, login: string } | null>(null);
    
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [accountToSwitch, setAccountToSwitch] = useState<{ id: number, login: string } | null>(null);

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
        const handleSuccess = (event: any) => {
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
    }, []);

    const confirmDelete = (id: number, login: string) => {
        setAccountToDelete({ id, login });
        setIsDeleteModalOpen(true);
    };
    
    const handleDeleteConfirm = () => {
        if (accountToDelete) {
            router.delete(route('admin.accounts.destroy', accountToDelete.id), {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: `Account ${accountToDelete.login} deleted successfully.`,
                        variant: "success",
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to delete account.",
                        variant: "destructive",
                    });
                },
            });
        }
    };

    const switchToUser = (id: number, login: string) => {
        setAccountToSwitch({ id, login });
        setIsSwitchModalOpen(true);
    };
    
    const handleSwitchConfirm = () => {
        if (accountToSwitch) {
            router.post(route('admin.accounts.switch', accountToSwitch.id), {}, {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: `Switched to user account: ${accountToSwitch.login}`,
                        variant: "success",
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to switch user account.",
                        variant: "destructive",
                    });
                },
            });
        }
    };

    const openEditModal = (account: Account) => {
        setSelectedAccount(account);
        setIsEditModalOpen(true);
    };

    const handleCreateSubmit = (data: any) => {
        setProcessing(true);
        router.post(route('admin.accounts.store'), data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setProcessing(false);
                toast({
                    title: "Success",
                    description: "Account created successfully.",
                    variant: "success",
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: "Error",
                    description: "Failed to create account. Please check the form for errors.",
                    variant: "destructive",
                });
            },
        });
    };

    const handleEditSubmit = (data: any) => {
        if (!selectedAccount) return;
        
        setProcessing(true);
        router.put(route('admin.accounts.update', selectedAccount.id), data, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedAccount(null);
                setProcessing(false);
                toast({
                    title: "Success",
                    description: "Account updated successfully.",
                    variant: "success",
                });
            },
            onError: () => {
                setProcessing(false);
                toast({
                    title: "Error",
                    description: "Failed to update account. Please check the form for errors.",
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
            title: 'Accounts',
            href: route('admin.accounts.index'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="my-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Accounts</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Account
                </Button>
            </div>

            <Card className="p-6">
                <div className="overflow-x-auto">
                    {accounts.data && accounts.data.length > 0 ? (
                        <AccountsTable 
                            accounts={accounts.data} 
                            roles={roles} 
                            onDelete={confirmDelete} 
                            onSwitch={switchToUser}
                            onEdit={openEditModal} 
                        />
                    ) : (
                        <div className="py-10 text-center">
                            <h3 className="text-lg font-medium text-gray-700">No accounts found</h3>
                            <p className="mt-2 text-gray-500">Get started by creating your first account</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Account Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[600px]" aria-describedby="create-account-form">
                    <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                        <DialogDescription>
                            Fill in the form to create a new account
                        </DialogDescription>
                    </DialogHeader>
                    <div id="create-account-form">
                        <AccountForm 
                            roles={roles} 
                            onSubmit={handleCreateSubmit} 
                            onCancel={() => setIsCreateModalOpen(false)}
                            isProcessing={processing}
                            errors={errors}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Account Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]" aria-describedby="edit-account-form">
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                        <DialogDescription>
                            Update the account information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAccount && (
                        <div id="edit-account-form">
                            <AccountForm 
                                account={selectedAccount}
                                roles={roles} 
                                onSubmit={handleEditSubmit} 
                                onCancel={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedAccount(null);
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
                title="Delete Account"
                description={`Are you sure you want to delete account ${accountToDelete?.login}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="destructive"
            />
            
            {/* Switch User Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isSwitchModalOpen}
                onClose={() => setIsSwitchModalOpen(false)}
                onConfirm={handleSwitchConfirm}
                title="Switch to User Account"
                description={`Are you sure you want to switch to user account ${accountToSwitch?.login}? You will be logged out of your admin account.`}
                confirmText="Switch"
                cancelText="Cancel"
                confirmVariant="default"
            />
        </AppLayout>
    );
}