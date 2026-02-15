'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Database, Folder, ChevronRight, ChevronDown, Plus, Home, LogOut } from 'lucide-react';
import Link from 'next/link';

interface DbInfo {
    name: string;
    collections?: { name: string }[];
    expanded?: boolean;
}

export default function Sidebar() {
    const [databases, setDatabases] = useState<DbInfo[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    const fetchDatabases = async () => {
        try {
            const res = await fetch('/api/mongodb/databases');
            const data = await res.json();
            setDatabases(data.map((db: any) => ({ ...db, expanded: false, collections: [] })));
        } catch (err) {
            console.error('Failed to fetch databases');
        }
    };

    useEffect(() => {
        fetchDatabases();
    }, []);

    const toggleExpand = async (dbName: string) => {
        setDatabases(prev => prev.map(db => {
            if (db.name === dbName) {
                return { ...db, expanded: !db.expanded };
            }
            return db;
        }));

        const db = databases.find(d => d.name === dbName);
        if (db && (!db.collections || db.collections.length === 0)) {
            try {
                const res = await fetch(`/api/mongodb/collections?db=${dbName}`);
                const data = await res.json();
                setDatabases(prev => prev.map(d => {
                    if (d.name === dbName) {
                        return { ...d, collections: data };
                    }
                    return d;
                }));
            } catch (err) {
                console.error('Failed to fetch collections');
            }
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <aside className="pma-sidebar fixed left-0 top-0 h-screen w-60 overflow-y-auto">
            <div className="flex h-10 items-center justify-between border-b border-gray-300 px-3">
                <div className="flex items-center gap-1.5 font-bold text-gray-700 condensed-text">
                    <Database className="h-4 w-4 text-gray-500" />
                    Server: localhost
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="p-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                    <Home className="h-3.5 w-3.5" />
                    (Root) /
                </Link>
                <div className="mt-1 flex flex-col">
                    {databases.map((db) => (
                        <div key={db.name}>
                            <div className="flex items-center hover:bg-white/50">
                                <button
                                    onClick={() => toggleExpand(db.name)}
                                    className="p-1 text-gray-500"
                                >
                                    {db.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                <Link
                                    href={`/dashboard/db/${db.name}`}
                                    className={`flex flex-1 items-center gap-1.5 py-1 pr-2 text-[11px] font-medium transition-colors ${pathname.includes(`/db/${db.name}`) ? 'bg-white font-bold text-blue-700' : 'text-gray-700'
                                        }`}
                                >
                                    <Database className="h-3 w-3 text-gray-400" />
                                    {db.name}
                                </Link>
                            </div>

                            {db.expanded && (
                                <div className="ml-5 border-l border-gray-300 pl-1">
                                    {db.collections?.map((col) => (
                                        <Link
                                            key={col.name}
                                            href={`/dashboard/db/${db.name}/col/${col.name}`}
                                            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-600 hover:bg-white"
                                        >
                                            <Folder className="h-3 w-3 text-gray-400" />
                                            {col.name}
                                        </Link>
                                    ))}
                                    {db.collections?.length === 0 && (
                                        <span className="block px-2 py-1 text-[10px] text-gray-400 italic">No collections</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 px-2 py-2 text-[11px] text-blue-600 hover:bg-gray-200"
                    >
                        <Plus className="h-3 w-3" />
                        New Database
                    </Link>
                </div>
            </div>
        </aside>
    );
}
