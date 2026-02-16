'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Settings, Save, Shield, Database, Globe, Server } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('main');

    const tabs = [
        { id: 'main', label: 'Main Settings', icon: Globe },
        { id: 'features', label: 'Features', icon: Server },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'database', label: 'Database', icon: Database },
    ];

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4">
                        <h1 className="text-xl font-normal text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-500" />
                            Settings
                        </h1>
                    </header>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Tab List */}
                        <div className="w-full md:w-48 flex flex-col border border-gray-300 bg-white rounded-sm shadow-sm overflow-hidden h-fit">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-xs text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${activeTab === tab.id ? 'bg-[#e8ecef] font-bold text-blue-800' : 'text-gray-600'
                                        }`}
                                >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="pma-panel flex-1 rounded-sm bg-[#f2f2f2] border border-gray-300 shadow-sm min-h-[400px]">
                            <div className="bg-[#e8ecef] px-4 py-2 border-b border-gray-300 text-xs font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2 uppercase tracking-tight">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </div>
                                <button className="bg-[#235a81] text-white px-3 py-1 rounded text-[10px] hover:bg-[#1a4461] transition-colors flex items-center gap-1">
                                    <Save className="h-3 w-3" /> Save Changes
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {activeTab === 'main' && (
                                    <div className="space-y-4 max-w-xl bg-white p-6 border border-gray-200 rounded-sm italic text-gray-400 text-center py-20">
                                        Core system settings will appear here.
                                    </div>
                                )}
                                {activeTab === 'features' && (
                                    <div className="space-y-4 max-w-xl bg-white p-6 border border-gray-200 rounded-sm flex flex-col gap-4">
                                        <div className="flex items-center justify-between pointer-events-none opacity-50">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">Enable Advanced Querying</span>
                                                <span className="text-[10px] text-gray-500">Enable complex aggregation pipelines in SQL console</span>
                                            </div>
                                            <input type="checkbox" defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between pointer-events-none opacity-50 border-t border-gray-100 pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">Audit Logging</span>
                                                <span className="text-[10px] text-gray-500">Log all database operations</span>
                                            </div>
                                            <input type="checkbox" />
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'security' && (
                                    <div className="space-y-4 max-w-xl bg-white p-6 border border-gray-200 rounded-sm italic text-gray-400 text-center py-20">
                                        Security and Authentication settings are currently managed via environment variables.
                                    </div>
                                )}
                                {activeTab === 'database' && (
                                    <div className="space-y-4 max-w-xl bg-white p-6 border border-gray-200 rounded-sm italic text-gray-400 text-center py-20">
                                        Connection string: <code>MONGODB_URI</code> is active.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
