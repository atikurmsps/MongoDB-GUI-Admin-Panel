'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ImportModal from '@/components/ImportModal';
import EditDocumentModal from '@/components/EditDocumentModal';
import { Table, Search, ChevronLeft, ChevronRight, Loader2, Download, Upload, ArrowLeft, Trash2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function BrowseCollectionPage({ params }: { params: Promise<{ name: string, colName: string }> }) {
    const { name: dbName, colName } = use(params);
    const [docs, setDocs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [editingDoc, setEditingDoc] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/mongodb/collections/data?db=${dbName}&col=${colName}&page=${page}`);
            const result = await res.json();
            setDocs(result.data || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error('Failed to fetch collection data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dbName, colName, page]);

    const handleExport = () => {
        window.open(`/api/mongodb/export?db=${dbName}&col=${colName}`, '_blank');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const res = await fetch(`/api/mongodb/collections/data?db=${dbName}&col=${colName}&id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete document');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleEdit = (doc: any) => {
        setEditingDoc(doc);
        setEditModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDoc(null);
        setEditModalOpen(true);
    };

    // Dynamic columns based on documents
    const allKeys = Array.from(new Set(docs.flatMap(doc => Object.keys(doc))));
    const columns = allKeys.filter(key => key !== '_id');

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4">
                        <div className="flex items-center gap-2 mb-2 text-[10px]">
                            <Link href={`/dashboard/db/${dbName}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <ArrowLeft className="h-3 w-3" /> Back to Database
                            </Link>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-500">Database: {dbName}</span>
                        </div>
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <Table className="h-5 w-5 text-gray-500" />
                            Table: {colName}
                        </h1>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300"
                            >
                                <Plus className="h-3.5 w-3.5 text-green-600" /> Insert
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300"
                            >
                                <Download className="h-3.5 w-3.5 text-blue-600" /> Export
                            </button>
                            <ImportModal dbName={dbName} onImported={fetchData} />
                        </div>
                    </header>

                    <div className="pma-panel rounded-sm bg-white overflow-hidden overflow-x-auto min-h-[400px]">
                        <div className="bg-[#f2f2f2] px-3 py-2 border-b border-gray-300 text-xs font-bold flex justify-between items-center whitespace-nowrap">
                            <div className="flex items-center gap-4">
                                <span>Showing {docs.length === 0 ? 0 : (page - 1) * 25 + 1} - {(page - 1) * 25 + docs.length} rows. Total: {total}</span>
                                <button onClick={fetchData} className="text-blue-600 hover:underline font-normal text-[10px]">Refresh</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-1 border border-gray-400 rounded hover:bg-white disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-[11px] min-w-[60px] text-center">Page {page}</span>
                                <button
                                    disabled={page * 25 >= total}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-1 border border-gray-400 rounded hover:bg-white disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : docs.length > 0 ? (
                            <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                                <thead className="bg-[#fcfcfc] border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 border-r border-gray-200 font-bold text-blue-800">_id</th>
                                        {columns.map(col => (
                                            <th key={col} className="px-3 py-2 border-r border-gray-200 font-bold text-blue-800">{col}</th>
                                        ))}
                                        <th className="px-3 py-2 w-24 text-center uppercase text-[10px] italic font-normal text-gray-500">Options</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {docs.map((doc, i) => (
                                        <tr key={doc._id || i} className="hover:bg-[#f9f9f9]">
                                            <td className="px-3 py-2 border-r border-gray-200 font-mono text-gray-500">
                                                {doc._id}
                                            </td>
                                            {columns.map(col => (
                                                <td key={col} className="px-3 py-2 border-r border-gray-200 font-mono">
                                                    {typeof doc[col] === 'object' ? JSON.stringify(doc[col]) : String(doc[col] ?? '')}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                                >
                                                    <Edit className="h-3 w-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="text-red-600 hover:underline inline-flex items-center gap-0.5"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-20 text-center text-gray-400 italic">No documents found in this collection.</div>
                        )}
                    </div>

                    <EditDocumentModal
                        dbName={dbName}
                        colName={colName}
                        document={editingDoc}
                        open={editModalOpen}
                        onOpenChange={setEditModalOpen}
                        onSaved={fetchData}
                    />

                    <div className="mt-8 italic text-gray-500 text-[10px]">
                        * Note: Editing complex MongoDB types (like Date, Int64, etc.) via JSON requires specific EJSON formatting or direct string mapping.
                    </div>
                </main>
            </div>
        </div>
    );
}
