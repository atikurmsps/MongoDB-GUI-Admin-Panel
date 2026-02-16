'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ImportModal from '@/components/ImportModal';
import ActionButtons from '@/components/ActionButtons';
import { ArrowLeft, Loader2, Table, Download, Shield, Plus } from 'lucide-react';
import Link from 'next/link';

interface CollectionInfo {
    name: string;
    count: number;
    size: number;
}

export default function DbPage({ params }: { params: Promise<{ name: string }> }) {
    const { name: dbName } = use(params);
    const [collections, setCollections] = useState<CollectionInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCollections = async () => {
        try {
            const res = await fetch(`/api/mongodb/collections?db=${dbName}`);
            const data = await res.json();
            setCollections(data);
        } catch (err) {
            console.error('Failed to fetch collections');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, [dbName]);

    const handleExport = async () => {
        window.open(`/api/mongodb/export?db=${dbName}`, '_blank');
    };

    const handleAction = async (collection: string, action: 'empty' | 'drop') => {
        const confirmMsg = action === 'drop'
            ? `Are you sure you want to DROP the collection "${collection}"? This cannot be undone.`
            : `Are you sure you want to EMPTY the collection "${collection}"?`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/mongodb/collections/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ database: dbName, collection, action }),
            });

            if (res.ok) {
                fetchCollections();
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${action} collection`);
            }
        } catch (err) {
            alert('Network error');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <Table className="h-5 w-5 text-gray-500" />
                            Database: {dbName}
                        </h1>

                        <ActionButtons dbName={dbName} onRefresh={fetchCollections} />
                    </header>

                    <div className="pma-panel rounded-sm bg-white overflow-hidden">
                        <div className="bg-[#f2f2f2] px-3 py-2 border-b border-gray-300 text-xs font-bold">
                            Structure
                        </div>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#fcfcfc] border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 w-8 text-center uppercase text-[10px]">#</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold">Table/Collection</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Rows</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Size</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center w-16">Browse</th>
                                    <th className="px-3 py-2 border-r border-gray-200 font-bold text-center w-16">Empty</th>
                                    <th className="px-3 py-2 font-bold text-center w-16">Drop</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {collections.map((col, idx) => (
                                    <tr key={col.name} className="hover:bg-[#f9f9f9]">
                                        <td className="px-3 py-2 border-r border-gray-200 text-center">{idx + 1}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 font-medium tracking-tight">
                                            <Link href={`/dashboard/db/${dbName}/col/${col.name}`} className="text-blue-700 font-normal">
                                                {col.name}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-center font-normal">{col.count}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-center font-normal">{(col.size / 1024).toFixed(1)} KB</td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-center uppercase text-[10px] not-italic">
                                            <Link href={`/dashboard/db/${dbName}/col/${col.name}`} className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                                                Browse
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-center uppercase text-[10px] not-italic">
                                            <button
                                                onClick={() => handleAction(col.name, 'empty')}
                                                className="text-red-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                                            >
                                                Empty
                                            </button>
                                        </td>
                                        <td className="px-3 py-2 text-center uppercase text-[10px] not-italic">
                                            <button
                                                onClick={() => handleAction(col.name, 'drop')}
                                                className="text-red-600 hover:underline font-bold flex items-center justify-center gap-1 mx-auto"
                                            >
                                                Drop
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {collections.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 not-italic">No collections found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 italic text-gray-600 text-[11px]">
                        * Data sizes are approximate.
                    </div>
                </main>
            </div>
        </div>
    );
}
