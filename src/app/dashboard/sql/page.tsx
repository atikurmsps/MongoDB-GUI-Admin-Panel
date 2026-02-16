'use client';

import { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Terminal, Play, Loader2, Database, Table, List } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SQLConsoleContent() {
    const searchParams = useSearchParams();
    const [dbName, setDbName] = useState(searchParams.get('db') || '');
    const [colName, setColName] = useState(searchParams.get('col') || '');
    const [query, setQuery] = useState('{\n  \n}');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [databases, setDatabases] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);

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

    const handleRunQuery = async () => {
        if (!dbName) {
            setError('Please select a database');
            return;
        }
        setLoading(true);
        setError('');
        setResults(null);

        try {
            const res = await fetch('/api/mongodb/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    database: dbName,
                    collection: colName || undefined,
                    query: query,
                    action: colName ? 'find' : 'command'
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setResults(data);
            } else {
                setError(data.error || 'Failed to execute query');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <header className="mb-4">
                <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-gray-500" />
                    SQL Console / Query
                </h1>
            </header>

            <div className="pma-panel rounded-sm bg-[#f2f2f2] border border-gray-300 mb-6">
                <div className="bg-[#e8ecef] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    Run MongoDB Query
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-gray-500" />
                            <select
                                value={dbName}
                                onChange={(e) => setDbName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs outline-none bg-white min-w-[150px]"
                            >
                                <option value="">Select Database</option>
                                {databases.map(db => (
                                    <option key={db.name} value={db.name}>{db.name}</option>
                                ))}
                            </select>
                        </div>
                        {dbName && (
                            <div className="flex items-center gap-2">
                                <Table className="h-4 w-4 text-gray-500" />
                                <select
                                    value={colName}
                                    onChange={(e) => setColName(e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs outline-none bg-white min-w-[150px]"
                                >
                                    <option value="">Run Server Command</option>
                                    {collections.map(col => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-40 font-mono text-xs p-3 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            placeholder={colName ? '{ "status": "active" }' : '{ "listDatabases": 1 }'}
                        />
                    </div>

                    <div className="flex justify-between items-center bg-[#f2f2f2] p-2 border border-gray-300 rounded-sm">
                        <div className="text-[10px] text-gray-500">
                            {colName ? `Query on ${dbName}.${colName}` : `Command on ${dbName || 'server'}`}
                        </div>
                        <button
                            onClick={handleRunQuery}
                            disabled={loading || !dbName}
                            className="bg-[#235a81] text-white px-4 py-1 text-xs rounded hover:bg-[#1a4461] disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Go
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-xs mb-6 font-mono">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {results && (
                <div className="pma-panel rounded-sm bg-white overflow-hidden flex-1 border border-gray-300 shadow-sm">
                    <div className="bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <List className="h-3.5 w-3.5" />
                            Results
                        </div>
                        <div className="text-[10px] font-normal text-gray-500">
                            {Array.isArray(results) ? `${results.length} documents found` : 'Command executed'}
                        </div>
                    </div>
                    <div className="p-4 overflow-auto max-h-[500px] bg-white">
                        <pre className="text-xs font-mono text-[#555] whitespace-pre-wrap">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}



export default function SQLConsolePage() {
    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <Suspense fallback={
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    }>
                        <SQLConsoleContent />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
