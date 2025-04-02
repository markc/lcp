import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

interface Vhost {
  id: number;
  domain: string;
}

interface Mailbox {
  id: number;
  user: string;
}

interface Props {
  vhosts: Vhost[];
  mailboxes: Mailbox[];
  preselectedVhostId?: number | string;
}

export default function ValiasCreate({ vhosts, mailboxes: initialMailboxes, preselectedVhostId }: Props) {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>(initialMailboxes || []);
  const [isExternalTarget, setIsExternalTarget] = useState(true);
  
  const { data, setData, errors, post, processing } = useForm({
    hid: preselectedVhostId || (vhosts.length > 0 ? vhosts[0].id : ''),
    source: '',
    target: '',
    active: true,
    configure_alias: true,
  });

  // Set selected domain when vhost changes
  const selectedVhost = vhosts.find((vhost) => vhost.id === Number(data.hid));
  const domain = selectedVhost ? selectedVhost.domain : '';

  // Load mailboxes when vhost changes
  useEffect(() => {
    if (data.hid) {
      axios.get(route('admin.valias.mailboxes', { vhost_id: data.hid }))
        .then(response => {
          setMailboxes(response.data);
        })
        .catch(error => {
          console.error('Failed to load mailboxes:', error);
        });
    }
  }, [data.hid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.valias.store'));
  };

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
      title: 'Create',
      href: route('admin.valias.create'),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Mail Alias</h1>
        <Link href={route('admin.valias.index')}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <div className="flex items-center">
                    <Input
                      id="source"
                      type="text"
                      value={data.source}
                      onChange={(e) => setData('source', e.target.value)}
                      placeholder="alias"
                      required
                      className="rounded-r-none focus:z-10"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                      @{domain}
                    </span>
                  </div>
                  {errors.source && (
                    <p className="text-red-500 text-sm mt-1">{errors.source}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="target">Target Destination</Label>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="target-type" className="text-sm cursor-pointer">Target Type:</Label>
                      <Select
                        id="target-type"
                        value={isExternalTarget ? "external" : "local"}
                        onValueChange={(value) => setIsExternalTarget(value === "external")}
                      >
                        <option value="external">External Email</option>
                        <option value="local">Local Mailbox</option>
                      </Select>
                    </div>
                  </div>
                  
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
                      id="target"
                      value={data.target}
                      onValueChange={(value) => setData('target', value)}
                      required
                    >
                      <option value="">Select a mailbox</option>
                      {mailboxes.map((mailbox) => (
                        <option key={mailbox.id} value={mailbox.user}>
                          {mailbox.user}
                        </option>
                      ))}
                    </Select>
                  )}
                  {errors.target && (
                    <p className="text-red-500 text-sm mt-1">{errors.target}</p>
                  )}
                </div>
              </div>
              
              <div className="text-gray-500 text-sm mt-1">
                {isExternalTarget ? 
                  "Enter a valid email address where messages will be forwarded." :
                  "Select a local mailbox to receive messages for this alias."
                }
              </div>
            </div>

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
                id="configure_alias"
                checked={data.configure_alias}
                onCheckedChange={(checked) => setData('configure_alias', checked as boolean)}
              />
              <Label htmlFor="configure_alias" className="cursor-pointer">
                Configure alias now (runs system setup)
              </Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={processing}>
                Create Alias
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}