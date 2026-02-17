'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Loader2, Lock } from 'lucide-react';
import * as Label from '@radix-ui/react-label';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // Initial check on mount
        fetch('/api/setup')
            .then(res => res.json())
            .then(data => {
                if (!data.isSetup) {
                    router.push('/setup');
                } else {
                    setVerifying(false);
                }
            })
            .catch(() => setVerifying(false));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/dashboard');
            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4 font-sans">
            <div className="w-full max-w-md bg-white border border-gray-300 rounded-sm shadow-xl overflow-hidden">
                <div className="bg-[#f8f8f8] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <h1 className="text-[15px] font-bold text-gray-800 uppercase tracking-tight">MongoAdmin Login</h1>
                    </div>
                    <Lock className="h-4 w-4 text-gray-400" />
                </div>

                <div className="p-8">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label.Root htmlFor="username" className="text-[11px] font-bold text-gray-600 uppercase">
                                Username
                            </Label.Root>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-sm bg-[#fcfcfc] px-3 py-2 text-[13px] text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label.Root htmlFor="password" title="password" className="text-[11px] font-bold text-gray-600 uppercase">
                                Password
                            </Label.Root>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-sm bg-[#fcfcfc] px-3 py-2 text-[13px] text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 border border-red-200 bg-red-50 rounded-sm text-red-700 text-[11px] italic animate-in fade-in slide-in-from-top-1">
                                * {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg border border-blue-700 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Establish Connection'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-[#f8f8f8] border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        System Ready
                    </div>
                </div>
            </div>
        </div>
    );
}
