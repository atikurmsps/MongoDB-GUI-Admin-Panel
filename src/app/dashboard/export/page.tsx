'use client';

import { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Download, Loader2, Database, Table, FileJson } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ExportContent() {
    const searchParams = useSearchParams();
    const [dbName, setDbName] = useState(searchParams.get('db') || '');
    const [colName, setColName] = useState(searchParams.get('col') || '');
    const [databases, setDatabases] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDbs = async () => {
            const res = await fetch('/api/mongodb/databases');
            const data = await res.json();
            if (Array.isArray(data)) setDatabases(data);
        };
        fetchDbs();
    }, []);

    useEffect(() => {
        if (dbName) {
            const fetchCols = async () => {
                const res = await fetch(`/api/mongodb/collections?db=${dbName}`);
                const data = await res.json();
                if (Array.isArray(data)) setCollections(data);
            };
            fetchCols();
        } else {
            setCollections([]);
        }
    }, [dbName]);

    const handleExport = () => {
        if (!dbName) return;
        let url = `/api/mongodb/export?db=${dbName}`;
        if (colName) url += `&col=${colName}`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex-1 flex flex-col">
            <header className="mb-4">
                <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                    <Download className="h-5 w-5 text-gray-500" />
                    Export
                </h1>
            </header>

            <div className="pma-panel rounded-sm bg-[#f2f2f2] border border-gray-300 mb-6">
                <div className="bg-[#e8ecef] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                    <FileJson className="h-3.5 w-3.5" />
                    Exporting databases from the current server
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4 max-w-lg">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700">Database:</label>
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-gray-400" />
                                <select
                                    value={dbName}
                                    onChange={(e) => setDbName(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs outline-none bg-white shadow-sm"
                                >
                                    <option value="">Select Database</option>
                                    {databases.map(db => (
                                        <option key={db.name} value={db.name}>{db.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {dbName && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-700">Collection (Optional):</label>
                                <div className="flex items-center gap-2">
                                    <Table className="h-4 w-4 text-gray-400" />
                                    <select
                                        value={colName}
                                        onChange={(e) => setColName(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs outline-none bg-white shadow-sm"
                                    >
                                        <option value="">Whole Database</option>
                                        {collections.map(col => (
                                            <option key={col.name} value={col.name}>{col.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 border border-gray-200 rounded-sm">
                        <h3 className="text-xs font-bold mb-3 border-b border-gray-100 pb-2">Export Method:</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs">
                                <input type="radio" defaultChecked name="method" />
                                <span>Quick - display only the minimal options</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <input type="radio" disabled name="method" />
                                <span>Custom - display all possible options (Coming soon)</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-4 border border-gray-200 rounded-sm">
                        <h3 className="text-xs font-bold mb-3 border-b border-gray-100 pb-2">Format:</h3>
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs outline-none bg-white shadow-sm w-32">
                            <option>JSON</option>
                        </select>
                    </div>

                    <div className="flex justify-start bg-[#f2f2f2] pt-4 border-t border-gray-300">
                        <button
                            onClick={handleExport}
                            disabled={!dbName}
                            className="bg-[#235a81] text-white px-8 py-1.5 text-xs rounded hover:bg-[#1a4461] disabled:opacity-50 transition-colors shadow-sm font-bold uppercase tracking-tight"
                        >
                            Go
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExportPage() {
    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-blue-600" />}>
                        <ExportContent />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
