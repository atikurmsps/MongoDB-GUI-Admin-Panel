'use client';

import { Database, Terminal, BarChart2, Users, Download, Upload, Settings, UserCircle, Key, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useState, useEffect } from 'react';

const menuItems = [
    { name: 'Databases', icon: Database, href: '/dashboard' },
    { name: 'SQL', icon: Terminal, href: '/dashboard/sql', roles: ['admin', 'editor'] },
    { name: 'Status', icon: BarChart2, href: '/dashboard/status' },
    { name: 'DB User accounts', icon: Users, href: '/dashboard/users', roles: ['admin', 'editor'] },
    { name: 'Export', icon: Download, href: '/dashboard/export', roles: ['admin', 'editor'] },
    { name: 'Import', icon: Upload, href: '/dashboard/import', roles: ['admin', 'editor'] },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['admin'] },
    { name: 'Users', icon: UserCircle, href: '/dashboard/admin-users', roles: ['admin'] },
    { name: 'Change Password', icon: Key, href: '/dashboard/change-password' },

];

export default function Topbar() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setRole(data.role))
            .catch(() => { });
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const filteredItems = menuItems.filter(item => {
        if (!item.roles) return true;
        if (!role) return false; // Hide until role is loaded or assume guest?
        return item.roles.includes(role);
    });

    return (
        <div className="flex h-[34px] items-center border-b border-gray-300 px-2 sticky top-0 z-10 bg-gradient-to-b from-[#f8f8f8] to-[#dcdcdc] shadow-sm mb-1 text-sans">
            <div className="flex items-center gap-0 overflow-x-auto whitespace-nowrap scrollbar-hide h-full flex-1">
                {filteredItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-1.5 px-3 h-full text-[11px] font-medium text-gray-700 hover:bg-white/60 hover:text-blue-800 transition-all border-r border-gray-200 last:border-r-0"
                    >
                        <item.icon className="h-3 w-3 text-gray-500" />
                        {item.name}
                    </Link>
                ))}


                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 h-full text-[10px] font-bold uppercase tracking-tight text-red-600 hover:bg-red-50 transition-all border-l border-gray-300 ml-auto"
                >
                    <LogOut className="h-3 w-3" />
                    Logout
                </button>
            </div>
        </div>
    );
}

