'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Database, Folder, ChevronRight, ChevronDown, Plus, Home, LogOut, Link2 } from 'lucide-react';
import Link from 'next/link';

interface DbInfo {
    name: string;
    collections?: { name: string }[];
    expanded?: boolean;
}

export default function Sidebar() {
    const [databases, setDatabases] = useState<DbInfo[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setRole(data.role))
            .catch(() => { });
    }, []);

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
                <Link
                    href="/dashboard/connection-checker"
                    className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${pathname === '/dashboard/connection-checker' ? 'bg-white font-bold text-blue-700' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                    <Link2 className="h-3.5 w-3.5 text-gray-400" />
                    Connection Tester
                </Link>
                <div className="mt-1 flex flex-col gap-0.5">
                    {databases.map((db) => {
                        const isActive = pathname.includes(`/db/${db.name}`);
                        return (
                            <div key={db.name} className="group flex flex-col">
                                <div className={`flex items-center transition-all ${isActive ? 'bg-white shadow-[inset_3px_0_0_0_#2563eb]' : 'hover:bg-gray-200/50'}`}>
                                    <button
                                        onClick={() => toggleExpand(db.name)}
                                        className={`p-1.5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    >
                                        {db.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </button>
                                    <Link
                                        href={`/dashboard/db/${db.name}`}
                                        className={`flex flex-1 items-center gap-2 py-1.5 pr-3 text-[11px] transition-colors ${isActive ? 'font-bold text-blue-700' : 'text-gray-700'}`}
                                    >
                                        <Database className={`h-3 w-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <span className="truncate">{db.name}</span>
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
                        );
                    })}
                    {role === 'admin' && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1.5 px-2 py-2 text-[11px] text-blue-600 hover:bg-gray-200"
                        >
                            <Plus className="h-3 w-3" />
                            New Database
                        </Link>
                    )}

                </div>
            </div>
        </aside>

    );
}
