'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Check, Copy, Edit, ShieldCheck, ShieldAlert, Settings2, RefreshCw } from 'lucide-react';

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
    const [rolePreset, setRolePreset] = useState<'readOnly' | 'full' | 'custom'>('custom');
    const [showCustomRoles, setShowCustomRoles] = useState(false);
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
            const roles = user.roles.map((r: any) => r.role);
            setSelectedRoles(roles);

            // Determine preset
            if (roles.length === 1 && roles[0] === 'read') {
                setRolePreset('readOnly');
                setShowCustomRoles(false);
            } else if (roles.length === 2 && roles.includes('readWrite') && roles.includes('dbAdmin')) {
                setRolePreset('full');
                setShowCustomRoles(false);
            } else {
                setRolePreset('custom');
                setShowCustomRoles(true);
            }
        }
        setPassword('');
    }, [user, open]);

    const getUri = () => {
        if (!user) return '';
        const pwd = password || '[password]';
        const { protocol, host, options } = config;
        return `${protocol}://${user.user}:${pwd}@${host}/${dbName}${options}`;
    };

    const handleCopy = () => {
        const uri = getUri();
        if (!uri) return;
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePresetChange = (preset: 'readOnly' | 'full' | 'custom') => {
        setRolePreset(preset);
        if (preset === 'readOnly') {
            setSelectedRoles(['read']);
            setShowCustomRoles(false);
        } else if (preset === 'full') {
            setSelectedRoles(['readWrite', 'dbAdmin']);
            setShowCustomRoles(false);
        } else {
            setShowCustomRoles(true);
        }
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const generatePassword = () => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let retVal = '';
        for (let i = 0, n = charset.length; i < 25; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setPassword(retVal);
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
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#f3f3f3] p-0 shadow-2xl border border-gray-400 font-sans">
                    <div className="bg-gradient-to-b from-[#f8f8f8] to-[#dcdcdc] border-b border-gray-400 px-4 py-2.5 flex items-center justify-between rounded-t-md shadow-sm">
                        <Dialog.Title className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            Edit User Account: <span className="text-blue-700 font-mono">{user?.user}</span>
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                            Modify permissions or change the password for the selected MongoDB user account.
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button className="h-[22px] w-[22px] flex items-center justify-center border border-gray-400 bg-white rounded-sm text-gray-600 hover:bg-gray-100 hover:text-red-500 transition-all shadow-sm" aria-label="Close">
                                <X className="h-4 w-4 stroke-[2.5]" />
                            </button>
                        </Dialog.Close>
                    </div>


                    <form onSubmit={handleSubmit} className="p-0">
                        <div className="p-1">
                            <div className="bg-[#f3f3f3] border border-gray-300 rounded-sm overflow-hidden shadow-inner">
                                <div className="p-6 space-y-4">
                                    {/* Security - Password Change */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-1/4 text-[12px] font-normal text-gray-700 text-right">Change Password:</label>
                                        <div className="w-3/4 flex gap-2">
                                            <input
                                                type="text"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="flex-1 border border-gray-400 rounded-sm px-2 py-1 text-sm outline-none focus:bg-white bg-white shadow-sm"
                                                placeholder="Leave blank to keep current"
                                            />
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="px-2 py-1 bg-gray-100 border border-gray-400 rounded-sm hover:bg-white text-gray-600 transition-colors shadow-sm flex items-center gap-1 text-[11px] font-medium"
                                                title="Generate URI friendly password"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    <div className="flex items-start gap-4">
                                        <label className="w-1/4 text-[12px] font-normal text-gray-700 text-right mt-1">Privileges:</label>
                                        <div className="w-3/4 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePresetChange('readOnly')}
                                                    className={`px-3 py-1 text-[11px] rounded-full border transition-all ${rolePreset === 'readOnly' ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                                >
                                                    Read Only
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePresetChange('full')}
                                                    className={`px-3 py-1 text-[11px] rounded-full border transition-all ${rolePreset === 'full' ? 'bg-green-100 border-green-400 text-green-700 font-bold' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                                >
                                                    Full Access
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePresetChange('custom')}
                                                    className={`px-3 py-1 text-[11px] rounded-full border transition-all ${rolePreset === 'custom' ? 'bg-purple-100 border-purple-400 text-purple-700 font-bold' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                                >
                                                    Custom...
                                                </button>
                                            </div>

                                            {showCustomRoles && (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 bg-white border border-gray-200 rounded-sm shadow-inner max-h-[150px] overflow-y-auto">
                                                    {AVAILABLE_ROLES.map(role => (
                                                        <label key={role} className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRoles.includes(role)}
                                                                onChange={() => toggleRole(role)}
                                                                className="rounded border-gray-300 text-blue-600"
                                                            />
                                                            <span className="text-[11px] text-gray-600 group-hover:text-blue-600 transition-colors uppercase">{role}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* URI Display */}
                                    <div className="flex items-start gap-4 pt-2">
                                        <label className="w-1/4 text-[11px] font-bold text-gray-400 text-right mt-1 uppercase">URI Detail:</label>
                                        <div className="w-3/4">
                                            <div className="relative group">
                                                <div className="w-full text-[10px] font-mono break-all text-gray-500 bg-[#f9f9f9] p-2 border border-gray-200 rounded-sm">
                                                    {getUri()}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleCopy}
                                                    className="absolute right-1 top-1 p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 p-2 text-red-700 text-[11px] rounded-sm text-center font-bold">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-[#dee3e8] px-4 py-3 flex items-center justify-end gap-3 rounded-b-md border-t border-gray-300">
                            <Dialog.Close asChild>
                                <button type="button" className="px-6 py-1.5 text-sm font-normal text-gray-700 bg-gradient-to-b from-white to-[#e5e5e5] border border-gray-400 rounded-full hover:to-[#dbdbdb] transition-all shadow-sm">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-1.5 text-sm font-bold text-gray-800 bg-gradient-to-b from-white to-[#e5e5e5] border border-gray-400 rounded-full hover:to-[#dbdbdb] transition-all shadow-sm active:translate-y-[1px] disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
