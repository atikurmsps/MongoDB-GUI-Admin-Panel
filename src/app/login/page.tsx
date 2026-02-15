'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Loader2, Lock } from 'lucide-react';
import * as Label from '@radix-ui/react-label';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md animate-in glass rounded-2xl p-8">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                    <p className="mt-2 text-sm text-gray-600">Enter your credentials to manage MongoDB</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label.Root htmlFor="username" className="text-sm font-medium text-gray-700">
                            Username
                        </Label.Root>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                            placeholder="admin"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label.Root htmlFor="password" title="password" className="text-sm font-medium text-gray-700">
                                Password
                            </Label.Root>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-lg bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don&apos;t have an account?{' '}
                    <button
                        onClick={() => router.push('/register')}
                        className="font-semibold text-primary hover:underline"
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
}
