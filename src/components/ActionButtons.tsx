'use client';

import Link from 'next/link';
import { Table, Download, Shield, Plus, List } from 'lucide-react';
import ImportModal from './ImportModal';
import CreateUserModal from './CreateUserModal';

interface ActionButtonsProps {
    dbName: string;
    onRefresh: () => void;
}

import { useState, useEffect } from 'react';

export default function ActionButtons({ dbName, onRefresh }: ActionButtonsProps) {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setRole(data.role))
            .catch(() => { });
    }, []);

    const handleExport = () => {
        window.open(`/api/mongodb/export?db=${dbName}`, '_blank');
    };

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            <Link
                href={`/dashboard/db/${dbName}`}
                className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300"
            >
                <List className="h-3.5 w-3.5" /> Browse
            </Link>

            {role !== 'viewer' && (
                <>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300"
                    >
                        <Download className="h-3.5 w-3.5" /> Export
                    </button>
                    <ImportModal dbName={dbName} onImported={onRefresh} />
                    <Link
                        href={`/dashboard/db/${dbName}/users`}
                        className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300"
                    >
                        <Shield className="h-3.5 w-3.5" /> User accounts
                    </Link>
                    <CreateUserModal dbName={dbName} onCreated={onRefresh} />
                </>
            )}
        </div>
    );
}

