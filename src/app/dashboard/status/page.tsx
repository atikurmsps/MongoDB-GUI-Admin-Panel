'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { BarChart2, Loader2, Clock, Activity, HardDrive, Network } from 'lucide-react';

export default function StatusPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/mongodb/status');
                const data = await res.json();
                if (res.ok) {
                    setStatus(data);
                } else {
                    setError(data.error || 'Failed to fetch server status');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-gray-500" />
                            Server Status
                        </h1>
                    </header>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-xs font-mono">
                            {error}
                        </div>
                    ) : status && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Runtime information */}
                            <div className="pma-panel rounded-sm bg-white border border-gray-300 overflow-hidden shadow-sm">
                                <div className="bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-gray-600" />
                                    Runtime Information
                                </div>
                                <div className="p-4 space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Version:</span>
                                        <span className="font-bold">{status.version}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Uptime:</span>
                                        <span className="font-bold">{formatUptime(status.uptime)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Local Time:</span>
                                        <span className="font-bold">{new Date(status.localTime).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Connections */}
                            <div className="pma-panel rounded-sm bg-white border border-gray-300 overflow-hidden shadow-sm">
                                <div className="bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-gray-600" />
                                    Connections
                                </div>
                                <div className="p-4 space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Current:</span>
                                        <span className="font-bold">{status.connections.current}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Available:</span>
                                        <span className="font-bold">{status.connections.available}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Active:</span>
                                        <span className="font-bold">{status.connections.active}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Memory */}
                            <div className="pma-panel rounded-sm bg-white border border-gray-300 overflow-hidden shadow-sm">
                                <div className="bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                                    <HardDrive className="h-3.5 w-3.5 text-gray-600" />
                                    Memory Usage
                                </div>
                                <div className="p-4 space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Resident:</span>
                                        <span className="font-bold">{status.mem.resident} MB</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500">Virtual:</span>
                                        <span className="font-bold">{status.mem.virtual} MB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Mapped:</span>
                                        <span className="font-bold">{status.mem.mapped || 'N/A'} MB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Network */}
                            <div className="pma-panel rounded-sm bg-white border border-gray-300 overflow-hidden shadow-sm lg:col-span-2">
                                <div className="bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300 text-xs font-bold flex items-center gap-2">
                                    <Network className="h-3.5 w-3.5 text-gray-600" />
                                    Network Traffic
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Bytes In:</span>
                                            <span className="font-bold">{status.network.bytesIn.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Bytes Out:</span>
                                            <span className="font-bold">{status.network.bytesOut.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Requests:</span>
                                            <span className="font-bold">{status.network.numRequests.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Counters (Insert):</span>
                                            <span className="font-bold">{status.opcounters.insert.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
