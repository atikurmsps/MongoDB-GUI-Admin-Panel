'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Check, Copy } from 'lucide-react';

const AVAILABLE_ROLES = [
    'read',
    'readWrite',
    'dbAdmin',
    'userAdmin',
    'clusterAdmin',
    'root'
];

interface EditUserModalProps {
    dbName: string;
    user: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export default function EditUserModal({ dbName, user, open, onOpenChange, onSaved }: EditUserModalProps) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [config, setConfig] = useState<{ protocol: string; host: string; options: string }>({
        protocol: 'mongodb',
        host: 'localhost:27017',
        options: ''
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/mongodb/config');
                const data = await res.json();
                setConfig(data);
            } catch (err) { }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (user && user.roles) {
            setSelectedRoles(user.roles.map((r: any) => r.role));
        }
        setPassword('');
    }, [user, open]);

    const getUri = () => {
        if (!user) return '';
        const pwd = password || '[password]';
        const { protocol, host, options } = config;
        return `${protocol}://${user.user}:${pwd}@${host}/${dbName}${options}`;
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleCopy = () => {
        const uri = getUri();
        if (!uri) return;
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/mongodb/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    database: dbName,
                    username: user.user,
                    roles: selectedRoles,
                    password: password || undefined
                }),
            });

            if (res.ok) {
                onOpenChange(false);
                onSaved();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update user privileges');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl border border-gray-400">
                    <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-2">
                        <Dialog.Title className="text-[14px] font-bold text-gray-900 uppercase">Edit User: {user?.user}</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium text-gray-700 uppercase">New Password</label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-[12px] outline-none focus:border-blue-400"
                            />
                        </div>

                        <div className="bg-blue-50 p-2 border border-blue-100 rounded-sm mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[9px] uppercase text-blue-600 font-bold">Connection URI</div>
                                {copied && <span className="text-[9px] font-bold text-green-600 flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Copied!</span>}
                            </div>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="w-full text-left text-[10px] font-mono break-all text-blue-800 bg-white p-1.5 border border-blue-200 hover:bg-blue-50/50 transition-colors group relative"
                                title="Click to copy URI"
                            >
                                {getUri()}
                                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="h-3 w-3 text-blue-400" />
                                </div>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[12px] font-medium text-gray-700 uppercase">Assign Roles</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRole(role)}
                                        className={`flex items-center justify-between rounded-sm border px-3 py-2 text-[11px] transition-all ${selectedRoles.includes(role)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {role}
                                        {selectedRoles.includes(role) && <Check className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-600 italic">*{error}</p>}

                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <Dialog.Close asChild>
                                <button type="button" className="bg-gray-100 px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-200">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-5 py-1.5 text-xs rounded border border-blue-700 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Update Privileges
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
