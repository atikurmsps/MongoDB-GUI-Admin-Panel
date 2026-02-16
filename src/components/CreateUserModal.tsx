'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, Loader2, Check, Copy, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, Settings2 } from 'lucide-react';

const AVAILABLE_ROLES = [
    'read',
    'readWrite',
    'dbAdmin',
    'userAdmin',
    'clusterAdmin',
    'root'
];

interface CreateUserModalProps {
    dbName?: string;
    onCreated: () => void;
}

export default function CreateUserModal({ dbName: initialDbName, onCreated }: CreateUserModalProps) {
    const [open, setOpen] = useState(false);
    const [dbName, setDbName] = useState(initialDbName || '');
    const [databases, setDatabases] = useState<any[]>([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rolePreset, setRolePreset] = useState<'readOnly' | 'full' | 'custom'>('full');
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['readWrite', 'dbAdmin']);
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

        if (!initialDbName) {
            const fetchDatabases = async () => {
                try {
                    const res = await fetch('/api/mongodb/databases');
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setDatabases(data);
                        if (data.length > 0 && !dbName) {
                            setDbName(data[0].name);
                        }
                    }
                } catch (err) { }
            };
            fetchDatabases();
        }
    }, [initialDbName]);

    const getUri = () => {
        const userStr = username || '[username]';
        const pwd = password || '[password]';
        const { protocol, host, options } = config;
        const db = dbName || '[database]';
        return `${protocol}://${userStr}:${pwd}@${host}/${db}${options}`;
    };

    const handleCopy = () => {
        const uri = getUri();
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
        if (!dbName) {
            setError('Please select a database');
            return;
        }
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
                if (!initialDbName && databases.length > 0) {
                    setDbName(databases[0].name);
                }
                handlePresetChange('full');
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
                <button className="flex items-center gap-1.5 bg-[#f2f2f2] px-3 py-1.5 text-xs border border-gray-400 rounded-sm hover:bg-white transition-colors font-bold text-gray-700 shadow-sm">
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                    Add user account
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#f3f3f3] p-0 shadow-2xl border border-gray-400 font-sans">
                    <div className="bg-gradient-to-b from-[#f8f8f8] to-[#dcdcdc] border-b border-gray-400 px-4 py-2.5 flex items-center justify-between rounded-t-md shadow-sm">
                        <Dialog.Title className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            Add User Account
                        </Dialog.Title>
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
                                    {/* Database Selection */}
                                    {!initialDbName && (
                                        <div className="flex items-center gap-4">
                                            <label className="w-1/4 text-[12px] font-normal text-gray-700 text-right">Database:</label>
                                            <div className="w-3/4">
                                                <select
                                                    value={dbName}
                                                    onChange={(e) => setDbName(e.target.value)}
                                                    className="w-full border border-gray-400 rounded-sm px-2 py-1 text-sm outline-none focus:bg-white bg-[#fcfcfc] transition-colors shadow-sm"
                                                    required
                                                >
                                                    {databases.map(db => (
                                                        <option key={db.name} value={db.name}>{db.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Credentials */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-1/4 text-[12px] font-normal text-gray-700 text-right">Username:</label>
                                        <div className="w-3/4">
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                className="w-full border border-gray-400 rounded-sm px-2 py-1 text-sm outline-none focus:bg-white bg-white shadow-sm"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-1/4 text-[12px] font-normal text-gray-700 text-right">Password:</label>
                                        <div className="w-3/4">
                                            <input
                                                type="text" // Changed to text to follow reference if needed, usually password
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full border border-gray-400 rounded-sm px-2 py-1 text-sm outline-none focus:bg-white bg-white shadow-sm"
                                                placeholder="password"
                                            />
                                        </div>
                                    </div>

                                    {/* Role Selection (Simplified for phpMyAdmin style) */}
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

                        {/* phpMyAdmin style Footer */}
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
