'use client';

import * as React from 'react';
import { ShieldCheck, Plus, Trash2, Mail, Lock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function AdminManager({ initialEnvAdmins = [], initialDbAdmins = [] }) {
  const [envAdmins, setEnvAdmins] = React.useState(initialEnvAdmins);
  const [dbAdmins, setDbAdmins] = React.useState(initialDbAdmins);
  const [emailInput, setEmailInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [deletingEmail, setDeletingEmail] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  async function loadAdmins() {
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (data.ok) {
        setEnvAdmins(data.envAdmins || []);
        setDbAdmins(data.dbAdmins || []);
      }
    } catch {
      // Ignored
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = emailInput.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to add admin email');
      }

      setEnvAdmins(data.envAdmins || []);
      setDbAdmins(data.dbAdmins || []);
      setEmailInput('');
      setSuccess(`Admin access granted to ${email}`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveAdmin(email) {
    const totalCount = envAdmins.length + dbAdmins.length;
    if (totalCount <= 1) {
      if (!confirm(`Warning: ${email} is the only authorized admin account. If you remove it, the admin panel will return to unrestricted demo mode. Are you sure?`)) {
        return;
      }
    } else {
      if (!confirm(`Revoke and remove admin access for ${email}?`)) return;
    }

    setError(null);
    setSuccess(null);
    setDeletingEmail(email);

    try {
      const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to remove admin email');
      }

      setEnvAdmins(data.envAdmins || []);
      setDbAdmins(data.dbAdmins || []);
      setSuccess(`Removed admin account: ${email}`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingEmail(null);
    }
  }

  const totalAdmins = envAdmins.length + dbAdmins.length;

  return (
    <Card tone="strong" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <CardEyebrow icon={Lock}>Admin Access & Role Permissions</CardEyebrow>
          <h2 className="mt-1 text-base font-bold text-on-surface">Manage & Delete Admin Accounts</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Authorize new admin accounts or delete existing admins. Changes take effect instantly across all sessions.
          </p>
        </div>
        <Badge variant={totalAdmins > 0 ? 'emerald' : 'amber'} className="gap-1.5 py-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          {totalAdmins === 0 ? 'Unrestricted (Demo Mode)' : `${totalAdmins} Admin${totalAdmins === 1 ? '' : 's'} Configured`}
        </Badge>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      {/* Add new admin form */}
      <form onSubmit={handleAddAdmin} className="mt-5 flex gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <Input
            type="email"
            placeholder="colleague@foundersignal.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="pl-9 text-xs"
            disabled={loading}
          />
        </div>
        <Button type="submit" size="sm" loading={loading} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Authorize New Admin
        </Button>
      </form>

      {/* Admin email roster */}
      <div className="mt-6 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          <span>Active Admin Accounts ({totalAdmins})</span>
          <span className="text-[10px] font-normal lowercase">Click delete to revoke access</span>
        </div>

        {totalAdmins === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-on-surface-variant">
            No admin accounts are locked. Currently, any signed-in user has demo admin access. Authorize an email above to restrict access.
          </div>
        ) : null}

        {/* Environment admins */}
        {envAdmins.map((email) => (
          <div
            key={`env-${email}`}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-on-surface truncate block">{email}</span>
                <span className="text-[10px] text-on-surface-variant">System Admin (.env.local)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="zinc" className="text-[10px]">
                .env.local
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAdmin(email)}
                disabled={deletingEmail === email}
                className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-1 text-xs"
                title={`Delete admin account: ${email}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        ))}

        {/* Dynamic DB admins */}
        {dbAdmins.map((item) => (
          <div
            key={`db-${item.id || item.email}`}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-on-surface truncate block">{item.email}</span>
                {item.addedBy ? (
                  <span className="text-[10px] text-on-surface-variant">Added by {item.addedBy}</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="emerald" className="text-[10px]">
                Active Admin
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAdmin(item.email)}
                disabled={deletingEmail === item.email}
                className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-1 text-xs"
                title={`Delete admin account: ${item.email}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default AdminManager;
