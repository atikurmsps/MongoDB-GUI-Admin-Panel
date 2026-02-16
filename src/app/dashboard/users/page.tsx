'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CreateUserModal from '@/components/CreateUserModal';
import { Users, Shield, Loader2, User, Trash2, Edit, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
    user: string;
    roles: { role: string; db: string }[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [config, setConfig] = useState<{ protocol: string; host: string; options: string }>({
        protocol: 'mongodb',
        host: 'localhost:27017',
        options: ''
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/mongodb/users/all');
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetch('/api/mongodb/config')
            .then(res => res.json())
            .then(setConfig)
            .catch(() => { });
    }, []);

    const getPrimaryDb = (user: UserInfo) => {
        return user.roles[0]?.db || 'admin';
    };

    const getUri = (user: UserInfo) => {
        const { protocol, host, options } = config;
        const db = getPrimaryDb(user);
        return `${protocol}://${user.user}:[password]@${host}/${db}${options}`;
    };

    const handleCopyUri = (uri: string, id: string) => {
        navigator.clipboard.writeText(uri);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="pl-60">
                <Topbar />
                <main className="p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-4">
                        <div className="flex items-center gap-3 text-gray-800">
                            <Users className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-bold tracking-tight">User accounts</h1>
                        </div>
                        <CreateUserModal onCreated={fetchUsers} />
                    </div>

                    <div className="bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
                        <div className="bg-[#f8f8f8] border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-500" />
                            <span className="text-xs font-bold text-gray-700 uppercase">User accounts overview</span>
                        </div>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#fcfcfc] border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 w-8 text-center uppercase text-[10px]">#</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">User</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Database</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Privileges</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Connection URI</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Edit</th>
                                    <th className="px-3 py-2 font-bold text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => {
                                        const mainDb = getPrimaryDb(user);
                                        const connectionUri = getUri(user);
                                        const uniqueId = `${user.user}-${idx}`;

                                        return (
                                            <tr key={uniqueId} className="hover:bg-[#f9f9f9]">
                                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                                    <User className="h-3.5 w-3.5 text-gray-400 mx-auto" />
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 font-bold text-gray-700">
                                                    {user.user}
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <Link href={`/dashboard/db/${mainDb}`} className="text-blue-700 hover:underline font-bold">
                                                        {mainDb}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles?.map((r: any, i: number) => (
                                                            <span key={i} className="bg-gray-100 text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                                                                {r.role}@{r.db}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 font-mono text-blue-800 text-[10px]">
                                                    <button
                                                        onClick={() => handleCopyUri(connectionUri, uniqueId)}
                                                        className="flex items-center gap-2 w-full text-left hover:bg-blue-50/50 p-1 rounded-sm transition-colors group"
                                                        title="Click to copy URI"
                                                    >
                                                        <span className="truncate max-w-[200px]">
                                                            {connectionUri}
                                                        </span>
                                                        {copiedId === uniqueId ? (
                                                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                                                        ) : (
                                                            <Copy className="h-3 w-3 text-gray-300 group-hover:text-blue-500 shrink-0" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                                    <Link
                                                        href={`/dashboard/db/${mainDb}/users`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Go to Database User Management"
                                                    >
                                                        <Edit className="h-4 w-4 mx-auto" />
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Link
                                                        href={`/dashboard/db/${mainDb}/users`}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Go to Database User Management to Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 mx-auto" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8 italic text-gray-600 text-[11px]">
                        * Click any Connection URI string to copy it to your clipboard.
                        <br />
                        * User management (Edit/Delete) is performed within the context of the user's primary database.
                    </div>
                </main>
            </div>
        </div>
    );
}
