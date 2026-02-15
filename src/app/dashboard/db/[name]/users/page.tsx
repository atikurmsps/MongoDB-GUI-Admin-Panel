'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ActionButtons from '@/components/ActionButtons';
import EditUserModal from '@/components/EditUserModal';
import { Users, Shield, ArrowLeft, Loader2, User, Key, Trash2, Edit, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
    user: string;
    roles: { role: string; db: string }[];
}

export default function DbUsersPage({ params }: { params: Promise<{ name: string }> }) {
    const { name: dbName } = use(params);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [config, setConfig] = useState<{ protocol: string; host: string; options: string }>({
        protocol: 'mongodb',
        host: 'localhost:27017',
        options: ''
    });
    const [passwords, setPasswords] = useState<Record<string, string>>({});

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/mongodb/users?db=${dbName}`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/mongodb/config');
            const data = await res.json();
            setConfig(data);
        } catch (err) {
            console.error('Failed to fetch config');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchConfig();
    }, [dbName]);

    const handleRemove = async (username: string) => {
        if (!confirm(`Are you sure you want to remove user "${username}"?`)) return;

        try {
            const res = await fetch(`/api/mongodb/users?db=${dbName}&username=${username}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleCopy = (uri: string, id: string) => {
        navigator.clipboard.writeText(uri);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getUri = (username: string) => {
        const password = passwords[username] || '[password]';
        const { protocol, host, options } = config;
        return `${protocol}://${username}:${password}@${host}/${dbName}${options}`;
    };

    const handlePasswordChange = (username: string, value: string) => {
        setPasswords(prev => ({ ...prev, [username]: value }));
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-gray-500" />
                            User accounts: {dbName}
                        </h1>
                        <ActionButtons dbName={dbName} onRefresh={fetchUsers} />
                    </header>

                    <div className="pma-panel rounded-sm bg-white overflow-hidden">
                        <div className="bg-[#f2f2f2] px-3 py-2 border-b border-gray-300 text-xs font-bold">
                            User accounts overview
                        </div>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#fcfcfc] border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 w-8 text-center uppercase text-[10px]">#</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">User</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Privileges</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Connection URI</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Edit</th>
                                    <th className="px-3 py-2 font-bold text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => <tr key={user.user} className="hover:bg-[#f9f9f9]">
                                    <td className="px-3 py-2 border-r border-gray-200 text-center"><User className="h-3.5 w-3.5 text-gray-400 mx-auto" /></td>
                                    <td className="px-3 py-2 border-r border-gray-200 font-bold text-gray-700">{user.user}</td>
                                    <td className="px-3 py-2 border-r border-gray-200">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((r: any, i: number) => (
                                                <span key={i} className="bg-gray-100 text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                                                    {r.role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 font-mono text-blue-800 text-[10px]">
                                        <button
                                            onClick={() => handleCopy(getUri(user.user), user.user)}
                                            className="flex items-center gap-2 w-full text-left hover:bg-blue-50/50 p-1 rounded-sm transition-colors group"
                                            title="Click to copy URI"
                                        >
                                            <span className="truncate max-w-[250px]" title={getUri(user.user)}>
                                                {getUri(user.user)}
                                            </span>
                                            {copiedId === user.user ? (
                                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                                            ) : (
                                                <Copy className="h-3 w-3 text-gray-300 group-hover:text-blue-500 shrink-0" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 text-center">
                                        <button
                                            onClick={() => { setEditingUser(user); setEditModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit User"
                                        >
                                            <Edit className="h-4 w-4 mx-auto" />
                                        </button>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleRemove(user.user)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4 mx-auto" />
                                        </button>
                                    </td>
                                </tr>
                                )}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">No users found for this database.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8 italic text-gray-600 text-[11px]">
                        * Click any Connection URI string to copy it to your clipboard.
                    </div>

                    <EditUserModal
                        dbName={dbName}
                        user={editingUser}
                        open={editModalOpen}
                        onOpenChange={setEditModalOpen}
                        onSaved={fetchUsers}
                    />
                </main>
            </div>
        </div>
    );
}
