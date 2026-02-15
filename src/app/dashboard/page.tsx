'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Database, Search, Loader2, Trash2, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface DbInfo {
    name: string;
    sizeOnDisk: number;
}

export default function Dashboard() {
    const [databases, setDatabases] = useState<DbInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDbName, setNewDbName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    const fetchDatabases = async () => {
        try {
            const res = await fetch('/api/mongodb/databases');
            const data = await res.json();
            if (Array.isArray(data)) {
                setDatabases(data);
            }
        } catch (err) {
            console.error('Failed to fetch databases');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDb = async () => {
        if (!newDbName.trim()) return;
        setCreateLoading(true);
        setCreateError('');

        try {
            const res = await fetch('/api/mongodb/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDbName }),
            });

            if (res.ok) {
                setNewDbName('');
                fetchDatabases();
            } else {
                const data = await res.json();
                setCreateError(data.error || 'Failed to create database');
            }
        } catch (err) {
            setCreateError('Connection error');
        } finally {
            setCreateLoading(false);
        }
    };

    const [deleteDbName, setDeleteDbName] = useState<string | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteDb = async () => {
        if (confirmName !== deleteDbName) return;
        setIsDeleting(true);
        try {
            const res = await fetch('/api/mongodb/databases/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: deleteDbName }),
            });

            if (res.ok) {
                setDeleteDbName(null);
                setConfirmName('');
                fetchDatabases();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete database');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchDatabases();
    }, []);

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <div className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4">Databases</h1>

                        <div className="pma-panel rounded-sm mb-6 p-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Database className="h-4 w-4 text-gray-500" />
                                        Create database
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Database name"
                                        value={newDbName}
                                        onChange={(e) => setNewDbName(e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateDb()}
                                    />
                                    <button
                                        onClick={handleCreateDb}
                                        disabled={createLoading || !newDbName.trim()}
                                        className="bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {createLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                        Create
                                    </button>
                                </div>
                                {createError && <p className="text-[10px] text-red-600 ml-2">{createError}</p>}
                            </div>
                        </div>

                        <div className="pma-panel rounded-sm overflow-hidden text-[#555]">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-[#f2f2f2] border-b border-gray-300">
                                    <tr>
                                        <th className="px-3 py-2 border-r border-gray-300 w-8">
                                            <CheckSquare className="h-3 w-3" />
                                        </th>
                                        <th className="px-3 py-2 border-r border-gray-300 font-bold">Database</th>
                                        <th className="px-3 py-2 border-r border-gray-300 font-bold">Collation</th>
                                        <th className="px-3 py-2 border-r border-gray-300 font-bold">Size</th>
                                        <th className="px-3 py-2 border-r border-gray-300 font-bold">User accounts</th>
                                        <th className="px-3 py-2 font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {databases.map((db) => (
                                        <tr key={db.name} className="hover:bg-[#f2f2f2]/50">
                                            <td className="px-3 py-2 border-r border-gray-300">
                                                <input type="checkbox" />
                                            </td>
                                            <td className="px-3 py-2 border-r border-gray-300">
                                                <Link href={`/dashboard/db/${db.name}`} className="text-blue-700 hover:underline">
                                                    {db.name}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2 border-r border-gray-300 text-gray-500 italic">utf8mb4_general_ci</td>
                                            <td className="px-3 py-2 border-r border-gray-300">{(db.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB</td>
                                            <td className="px-3 py-2 border-r border-gray-300">
                                                <Link href={`/dashboard/db/${db.name}/users`} className="text-[#235a81] hover:underline flex items-center gap-1">
                                                    User accounts
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    onClick={() => setDeleteDbName(db.name)}
                                                    className="text-red-700 hover:underline flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Drop
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-[#f2f2f2] p-2 text-[11px] font-bold border-t border-gray-300">
                                Total: {databases.length}
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {deleteDbName && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/30 backdrop-blur-[1px]">
                            <div className="bg-white rounded p-6 max-w-sm w-full shadow-2xl border border-gray-300">
                                <h2 className="text-lg font-bold mb-4 text-red-600">Drop Database</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to drop database <strong>{deleteDbName}</strong>? This action cannot be undone.
                                </p>

                                <div className="mb-6">
                                    <label className="block text-xs text-gray-500 mb-2">
                                        Please type <strong>{deleteDbName}</strong> to confirm:
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                        placeholder="Database name"
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-red-400"
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setDeleteDbName(null);
                                            setConfirmName('');
                                        }}
                                        className="px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteDb}
                                        disabled={confirmName !== deleteDbName || isDeleting}
                                        className="px-4 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                                        Drop Database
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
