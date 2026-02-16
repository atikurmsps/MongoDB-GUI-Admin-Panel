'use client';

import { Database, Terminal, BarChart2, Users, Download, Upload, Settings, List, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const menuItems = [
    { name: 'Databases', icon: Database, href: '/dashboard' },
    { name: 'SQL', icon: Terminal, href: '#' },
    { name: 'Status', icon: BarChart2, href: '#' },
    { name: 'User accounts', icon: Users, href: '/dashboard/users' },
    { name: 'Export', icon: Download, href: '#' },
    { name: 'Import', icon: Upload, href: '#' },
    { name: 'Settings', icon: Settings, href: '#' },
];

export default function Topbar() {
    return (
        <div className="pma-topbar flex h-10 items-center border-b border-gray-300 px-2 sticky top-0 z-10">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-1.5 rounded border border-transparent px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-white/50"
                    >
                        <item.icon className="h-3.5 w-3.5 text-gray-500" />
                        {item.name}
                    </Link>
                ))}
                <button className="flex items-center gap-1.5 rounded border border-transparent px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-white/50">
                    <List className="h-3.5 w-3.5 text-gray-500" />
                    More
                    <ChevronDown className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
