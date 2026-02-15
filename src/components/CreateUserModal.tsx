'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, Loader2, Check, Copy } from 'lucide-react';

const AVAILABLE_ROLES = [
    'read',
    'readWrite',
    'dbAdmin',
    'userAdmin',
    'clusterAdmin',
    'root'
];

export default function CreateUserModal({ dbName, onCreated }: { dbName: string, onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['readWrite']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [config, setConfig] = useState<{ protocol: string; host: string; options: string }>({
        protocol: 'mongodb',
        host: 'localhost:27017',
        options: ''
    });
    const [copied, setCopied] = useState(false);

    useState(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/mongodb/config');
                const data = await res.json();
                setConfig(data);
            } catch (err) { }
        };
        fetchConfig();
    });

    const getUri = () => {
        const userStr = username || '[username]';
        const pwd = password || '[password]';
        const { protocol, host, options } = config;
        return `${protocol}://${userStr}:${pwd}@${host}/${dbName}${options}`;
    };

    const handleCopy = () => {
        const uri = getUri();
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/mongodb/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ database: dbName, username, password, roles: selectedRoles }),
            });

            if (res.ok) {
                setOpen(false);
                setUsername('');
                setPassword('');
                setSelectedRoles(['readWrite']);
                onCreated();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create user');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl border border-gray-400">
                    <div className="mb-6 flex items-center justify-between">
                        <Dialog.Title className="text-xl font-bold text-gray-900">Add Database User</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                                placeholder="db_user"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" title="password" className="text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Set password"
                            />
                        </div>

                        <div className="bg-green-50 p-2 border border-green-100 rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[9px] uppercase text-green-600 font-bold">Connection URI</div>
                                {copied && <span className="text-[9px] font-bold text-green-600 flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Copied!</span>}
                            </div>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="w-full text-left text-[10px] font-mono break-all text-green-800 bg-white p-1.5 border border-green-200 hover:bg-green-50/50 transition-colors group relative"
                                title="Click to copy URI"
                            >
                                {getUri()}
                                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="h-3 w-3 text-green-400" />
                                </div>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">Assign Roles</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRole(role)}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${selectedRoles.includes(role)
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {role}
                                        {selectedRoles.includes(role) && <Check className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end gap-3">
                            <Dialog.Close asChild>
                                <button type="button" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Add User
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
