'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Link2, ShieldCheck, ShieldAlert, Loader2, Database, Copy, Check } from 'lucide-react';

export default function ConnectionChecker() {
    const [uri, setUri] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; version?: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleTest = async () => {
        if (!uri.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/mongodb/check-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uri }),
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ success: false, error: 'Network error or server unavailable' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <div className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-gray-500" />
                            Connection Tester
                        </h1>

                        <div className="pma-panel rounded-sm mb-6 max-w-2xl">
                            <div className="bg-[#fcfcfc] border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 uppercase">Test MongoDB Connection URI</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setUri('')}
                                        className="text-[10px] text-blue-600 hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase">MongoDB URI</label>
                                    <div className="relative group">
                                        <textarea
                                            value={uri}
                                            onChange={(e) => setUri(e.target.value)}
                                            placeholder="mongodb://username:password@host:port/database"
                                            className="w-full h-24 p-2 border border-gray-300 rounded-sm text-xs font-mono outline-none focus:border-blue-400 bg-gray-50/50"
                                        />
                                        {uri && (
                                            <button
                                                onClick={handleCopy}
                                                className="absolute right-2 top-2 p-1.5 bg-white border border-gray-200 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                                                title="Copy URI"
                                            >
                                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname</p>
                                </div>

                                <button
                                    onClick={handleTest}
                                    disabled={loading || !uri.trim()}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-sm text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                                    Test Connection
                                </button>
                            </div>
                        </div>

                        {result && (
                            <div className={`pma-panel rounded-sm max-w-2xl overflow-hidden border ${result.success ? 'border-green-300' : 'border-red-300'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                                <div className={`px-4 py-2 border-b flex items-center gap-2 ${result.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {result.success ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                    <span className="text-[11px] font-bold uppercase">
                                        {result.success ? 'Connection Successful' : 'Connection Failed'}
                                    </span>
                                </div>
                                <div className="p-4 bg-white">
                                    {result.success ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-700">{result.message}</p>
                                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                                                <div>
                                                    <div className="text-[9px] uppercase text-gray-400 font-bold mb-1">Server Version</div>
                                                    <div className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 border border-gray-200 inline-block rounded">
                                                        {result.version}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] uppercase text-gray-400 font-bold mb-1">Status</div>
                                                    <div className="text-xs font-bold text-green-600">ONLINE</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-sm text-red-700 font-medium">An error occurred while attempting to connect:</p>
                                            <div className="bg-red-50 p-3 border border-red-100 rounded text-xs font-mono text-red-800 break-all">
                                                {result.error}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
