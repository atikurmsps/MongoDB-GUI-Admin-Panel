'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Upload, Loader2, Database, Table, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ImportContent() {
    const searchParams = useSearchParams();
    const [dbName, setDbName] = useState(searchParams.get('db') || '');
    const [colName, setColName] = useState(searchParams.get('col') || '');
    const [databases, setDatabases] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImport = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file || !dbName) {
            setError('Please select a file and a database');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string);
                    const res = await fetch(`/api/mongodb/import?db=${dbName}${colName ? `&col=${colName}` : ''}`, {
                        method: 'POST',
                        body: JSON.stringify(content),
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (res.ok) {
                        setSuccess('Import successful!');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    } else {
                        const data = await res.json();
                        setError(data.error || 'Import failed');
                    }
                } catch (err) {
                    setError('Invalid JSON format in file');
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsText(file);
        } catch (err) {
            setError('Failed to read file');
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <header className="mb-4">
                <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-gray-500" />
                    Import
                </h1>
            </header>

            <div className="pma-panel rounded-sm bg-[#f2f2f2] border border-gray-300 mb-6">
                <div className="bg-[#e8ecef] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                    <FileUp className="h-3.5 w-3.5" />
                    Importing into the current server
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4 max-w-lg">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700">Target Database:</label>
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
                                <label className="text-[11px] font-bold text-gray-700">Target Collection (Optional):</label>
                                <div className="flex items-center gap-2">
                                    <Table className="h-4 w-4 text-gray-400" />
                                    <select
                                        value={colName}
                                        onChange={(e) => setColName(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs outline-none bg-white shadow-sm"
                                    >
                                        <option value="">Bulk Import (from JSON object keys)</option>
                                        {collections.map(col => (
                                            <option key={col.name} value={col.name}>{col.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 border border-gray-200 rounded-sm">
                        <h3 className="text-xs font-bold mb-4 border-b border-gray-100 pb-2">File to import:</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-500 italic">Select JSON file (max. {process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE || '50'}MB):</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".json"
                                    className="text-xs file:mr-4 file:py-1 file:px-4 file:rounded-sm file:border file:border-gray-300 file:text-xs file:bg-gray-50 hover:file:bg-gray-100 cursor-pointer"
                                />
                            </div>
                            <div className="text-[10px] text-gray-400">
                                Note: If you import into a specific collection, the JSON should be an array of documents.
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 border border-red-100 rounded">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 p-2 border border-green-100 rounded">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {success}
                            </div>
                        )}

                        <div className="flex justify-start bg-[#f2f2f2] pt-4 border-t border-gray-300">
                            <button
                                onClick={handleImport}
                                disabled={loading || !dbName}
                                className="bg-[#235a81] text-white px-8 py-1.5 text-xs rounded hover:bg-[#1a4461] disabled:opacity-50 transition-colors shadow-sm font-bold uppercase tracking-tight flex items-center gap-2"
                            >
                                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ImportPage() {
    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-blue-600" />}>
                        <ImportContent />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
