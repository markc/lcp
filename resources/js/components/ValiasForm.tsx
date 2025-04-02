import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface Vhost {
    id: number;
    domain: string;
}

interface Mailbox {
    id: number;
    user: string;
}

interface Valias {
    id?: number;
    hid: number;
    source: string;
    target: string;
    active: boolean;
    vhost?: {
        id: number;
        domain: string;
    };
}

interface ValiasFormProps {
    valias?: Valias;
    vhosts: Vhost[];
    mailboxes?: Mailbox[];
    onSubmit: (data: Record<string, unknown>) => void;
    onCancel: () => void;
    isProcessing?: boolean;
    errors?: Record<string, string>;
}

export function ValiasForm({
    valias,
    vhosts,
    mailboxes: initialMailboxes = [],
    onSubmit,
    onCancel,
    isProcessing = false,
    errors = {},
}: ValiasFormProps) {
    const [mailboxes, setMailboxes] = useState<Mailbox[]>(initialMailboxes);
    const [isExternalTarget, setIsExternalTarget] = useState(valias ? !initialMailboxes.some((m) => m.user === valias.target) : true);

    // Set default values for a new valias or use existing valias data
    const defaultValues = valias
        ? {
              hid: valias.hid,
              source: valias.source,
              target: valias.target,
              active: valias.active,
              configure_alias: false, // Not needed for edits
          }
        : {
              hid: vhosts.length > 0 ? vhosts[0].id : 0,
              source: '',
              target: '',
              active: true,
              configure_alias: true,
          };

    const { data, setData } = useForm(defaultValues);

    // Set selected domain when vhost changes
    const selectedVhost = vhosts.find((vhost) => vhost.id === Number(data.hid));
    const domain = selectedVhost ? selectedVhost.domain : '';

    // Check if domain is changing during edit
    const originalDomain = valias?.vhost?.domain;
    const domainChanged = valias && selectedVhost && originalDomain && originalDomain !== domain;

    // Load mailboxes when vhost changes
    useEffect(() => {
        if (data.hid) {
            axios
                .get(route('admin.valias.mailboxes', { vhost_id: data.hid }))
                .then((response) => {
                    setMailboxes(response.data);
                    // If domain changed and we're using a local mailbox, reset target
                    if (domainChanged && !isExternalTarget) {
                        setData('target', '');
                    }
                })
                .catch((error) => {
                    console.error('Failed to load mailboxes:', error);
                });
        }
    }, [data.hid, domainChanged, isExternalTarget, setData]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
                {/* Source and Target Destination row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Source column */}
                    <div>
                        <Label htmlFor="source">Source</Label>
                        <Input
                            id="source"
                            type="text"
                            value={data.source}
                            onChange={(e) => setData('source', e.target.value)}
                            placeholder={valias ? '' : 'alias or full email address'}
                            required
                        />
                        {errors.source && <p className="mt-1 text-sm text-red-500">{errors.source}</p>}
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Enter an alias (e.g., "info") or full email address</p>
                    </div>

                    {/* Target Destination column */}
                    <div>
                        <Label htmlFor="target">Target Destination</Label>
                        {isExternalTarget ? (
                            <Input
                                id="target"
                                type="text"
                                value={data.target}
                                onChange={(e) => setData('target', e.target.value)}
                                placeholder="user@example.com"
                                required
                            />
                        ) : (
                            <Select
                                value={data.target || 'select-mailbox'}
                                onValueChange={(value) => setData('target', value === 'select-mailbox' ? '' : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a mailbox" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="select-mailbox">Select a mailbox</SelectItem>
                                    {mailboxes.map((mailbox) => (
                                        <SelectItem key={mailbox.id} value={mailbox.user}>
                                            {mailbox.user}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.target && <p className="mt-1 text-sm text-red-500">{errors.target}</p>}
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                            {isExternalTarget ? 'Forward to external email address' : 'Deliver to local mailbox'}
                        </p>
                    </div>
                </div>

                {/* Domain and Target Type row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Domain column */}
                    <div>
                        <Label htmlFor="hid">Domain</Label>
                        <Select value={data.hid ? data.hid.toString() : '0'} onValueChange={(value) => setData('hid', parseInt(value))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a domain" />
                            </SelectTrigger>
                            <SelectContent>
                                {vhosts.map((vhost) => (
                                    <SelectItem key={vhost.id} value={vhost.id.toString()}>
                                        {vhost.domain}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.hid && <p className="mt-1 text-sm text-red-500">{errors.hid}</p>}
                        {domainChanged && (
                            <p className="mt-1 text-sm text-amber-500">Warning: Changing domain will recreate the alias under the new domain.</p>
                        )}
                    </div>

                    {/* Target Type column */}
                    <div>
                        <Label htmlFor="target-type">Target Type</Label>
                        <Select value={isExternalTarget ? 'external' : 'local'} onValueChange={(value) => setIsExternalTarget(value === 'external')}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="external">External Email</SelectItem>
                                <SelectItem value="local">Local Mailbox</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Choose where to forward messages</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="active" checked={data.active} onCheckedChange={(checked) => setData('active', !!checked)} />
                    <Label htmlFor="active" className="cursor-pointer">
                        Active
                    </Label>
                    {errors.active && <p className="mt-1 text-sm text-red-500">{errors.active}</p>}
                </div>

                {!valias && (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="configure_alias"
                            checked={data.configure_alias}
                            onCheckedChange={(checked) => setData('configure_alias', !!checked)}
                        />
                        <Label htmlFor="configure_alias" className="cursor-pointer">
                            Configure alias now (runs system setup)
                        </Label>
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                        {valias ? 'Update Alias' : 'Create Alias'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
