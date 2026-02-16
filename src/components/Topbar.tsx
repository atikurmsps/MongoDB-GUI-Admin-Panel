'use client';

import { Database, Terminal, BarChart2, Users, Download, Upload, Settings } from 'lucide-react';
import Link from 'next/link';

const menuItems = [
    { name: 'Databases', icon: Database, href: '/dashboard' },
    { name: 'SQL', icon: Terminal, href: '/dashboard/sql' },
    { name: 'Status', icon: BarChart2, href: '/dashboard/status' },
    { name: 'User accounts', icon: Users, href: '/dashboard/users' },
    { name: 'Export', icon: Download, href: '/dashboard/export' },
    { name: 'Import', icon: Upload, href: '/dashboard/import' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Topbar() {
    return (
        <div className="flex h-[34px] items-center border-b border-gray-300 px-2 sticky top-0 z-10 bg-gradient-to-b from-[#f8f8f8] to-[#dcdcdc] shadow-sm mb-1">
            <div className="flex items-center gap-0 overflow-x-auto whitespace-nowrap scrollbar-hide h-full">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-1.5 px-3 h-full text-[11px] font-medium text-gray-700 hover:bg-white/60 hover:text-blue-800 transition-all border-r border-gray-200 last:border-r-0"
                    >
                        <item.icon className="h-3 w-3 text-gray-500" />
                        {item.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
