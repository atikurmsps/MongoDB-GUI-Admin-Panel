'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Check, Copy, Edit, ShieldCheck, ShieldAlert, Settings2 } from 'lucide-react';

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
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#f3f3f3] p-1 shadow-2xl border border-gray-400">
                    <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
                        <Dialog.Title className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                            <Edit className="h-4 w-4 text-blue-600" />
                            Edit User Account: <span className="text-blue-700">{user?.user}</span>
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-red-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="p-4 bg-[#f3f3f3] max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Change Password */}
                            <div className="pma-panel p-3 border border-gray-300 rounded-sm bg-white shadow-sm space-y-2">
                                <label className="text-[11px] font-bold text-gray-600 uppercase block">Security</label>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-500">Change Password:</span>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs outline-none focus:border-blue-500"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                            </div>

                            {/* Role Presets */}
                            <div className="pma-panel p-3 border border-gray-300 rounded-sm bg-white shadow-sm space-y-3">
                                <label className="text-[11px] font-bold text-gray-600 uppercase block">Modify Privileges</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePresetChange('readOnly')}
                                        className={`flex flex-col items-center gap-1.5 border p-3 rounded-sm transition-all ${rolePreset === 'readOnly' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}`}
                                    >
                                        <ShieldCheck className={`h-5 w-5 ${rolePreset === 'readOnly' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span className="text-[10px] font-bold">Read Only</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetChange('full')}
                                        className={`flex flex-col items-center gap-1.5 border p-3 rounded-sm transition-all ${rolePreset === 'full' ? 'bg-green-50 border-green-500 text-green-700 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}`}
                                    >
                                        <ShieldAlert className={`h-5 w-5 ${rolePreset === 'full' ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className="text-[10px] font-bold text-center">Full DB Access</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetChange('custom')}
                                        className={`flex flex-col items-center gap-1.5 border p-3 rounded-sm transition-all ${rolePreset === 'custom' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}`}
                                    >
                                        <Settings2 className={`h-5 w-5 ${rolePreset === 'custom' ? 'text-purple-600' : 'text-gray-400'}`} />
                                        <span className="text-[10px] font-bold">Custom</span>
                                    </button>
                                </div>

                                {showCustomRoles && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-2">
                                            {AVAILABLE_ROLES.map(role => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => toggleRole(role)}
                                                    className={`flex items-center justify-between border px-2 py-1.5 rounded-sm text-[10px] transition-all font-medium ${selectedRoles.includes(role)
                                                        ? 'bg-purple-50 border-purple-400 text-purple-700'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {role}
                                                    {selectedRoles.includes(role) && <Check className="h-3 w-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Connection URI */}
                            <div className="bg-gray-100 p-3 border border-gray-300 rounded-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-[9px] uppercase text-gray-500 font-bold">Updated Connection URI</div>
                                    {copied && <span className="text-[9px] font-bold text-green-600 flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Copied!</span>}
                                </div>
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="w-full text-left text-[10px] font-mono break-all text-gray-700 bg-white p-2 border border-gray-300 hover:border-blue-400 transition-colors"
                                        title="Click to copy URI"
                                    >
                                        {getUri()}
                                    </button>
                                    <div className="absolute right-2 top-1.5 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <Copy className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-2 border border-red-200 bg-red-50 rounded-sm text-red-700 text-[11px] italic">
                                    * {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 mt-2 font-bold uppercase tracking-tight">
                                <Dialog.Close asChild>
                                    <button type="button" className="bg-[#f2f2f2] px-4 py-1.5 text-xs border border-gray-400 rounded-sm hover:bg-gray-200 text-gray-700">
                                        Cancel
                                    </button>
                                </Dialog.Close>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-6 py-1.5 text-xs rounded-sm border border-blue-800 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                >
                                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Update User Account
                                </button>
                            </div>
                        </form>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
