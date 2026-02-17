'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Key, Database, User, Lock, Wand2 } from 'lucide-react';

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        jwtSecret: '',
        mongodbUri: ''
    });
    const [verifying, setVerifying] = useState(true);
    const [setupInfo, setSetupInfo] = useState({
        hasUsers: false,
        config: {
            jwtSecret: '',
            mongodbUri: '',
            hasEnvMongo: false,
            hasEnvJwt: false
        }
    });

    useEffect(() => {
        // Check if already setup
        fetch('/api/setup')
            .then(res => res.json())
            .then(data => {
                setSetupInfo(data);

                // Pre-fill existing config if available
                setFormData(prev => ({
                    ...prev,
                    jwtSecret: data.config?.jwtSecret || prev.jwtSecret,
                    mongodbUri: data.config?.mongodbUri || prev.mongodbUri
                }));

                // Only generate secret if one doesn't exist
                if (!data.config?.jwtSecret) {
                    generateSecret();
                }
            })
            .catch(() => { })
            .finally(() => setVerifying(false));
    }, []);

    const generateSecret = () => {
        const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        setFormData(prev => ({ ...prev, jwtSecret: randomSecret }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Setup failed');
            }

            // Redirect to login
            router.push('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
                <Loader2 className="animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="bg-[#235a81] px-6 py-4 border-b border-[#1a4461]">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        System Setup
                    </h1>
                    <p className="text-blue-100 text-xs mt-1 opacity-80">
                        Configure your admin panel settings
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-sm text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex justify-between">
                                Admin Username
                                {setupInfo.hasUsers && <span className="text-[10px] text-orange-500 lowercase font-normal italic">admin already exists</span>}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    required={!setupInfo.hasUsers}
                                    disabled={setupInfo.hasUsers}
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#235a81] focus:ring-1 focus:ring-[#235a81] transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                    placeholder={setupInfo.hasUsers ? "Admin user exists" : "admin"}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                Admin Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="password"
                                    required={!setupInfo.hasUsers}
                                    disabled={setupInfo.hasUsers}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#235a81] focus:ring-1 focus:ring-[#235a81] transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                    placeholder={setupInfo.hasUsers ? "••••••••" : "••••••••"}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex justify-between">
                                <span>JWT Secret</span>
                                {setupInfo.config?.hasEnvJwt ?
                                    <span className="text-[10px] font-normal text-green-600 lowercase italic">loaded from .env</span> :
                                    (setupInfo.config?.jwtSecret ? <span className="text-[10px] font-normal text-blue-600 lowercase italic">loaded from sqlite</span> : null)
                                }
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        disabled={setupInfo.config?.hasEnvJwt || !!setupInfo.config?.jwtSecret}
                                        value={formData.jwtSecret}
                                        onChange={e => setFormData({ ...formData, jwtSecret: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#235a81] focus:ring-1 focus:ring-[#235a81] font-mono text-xs disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={generateSecret}
                                    disabled={setupInfo.config?.hasEnvJwt || !!setupInfo.config?.jwtSecret}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded border border-gray-300 transition-colors disabled:opacity-50"
                                    title="Generate Random Secret"
                                >
                                    <Wand2 className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Used for signing session tokens. Keep this secure.</p>
                            {setupInfo.config?.hasEnvJwt && <p className="text-[10px] text-green-600 mt-1 italic">Environment variable is active and cannot be changed here.</p>}
                        </div>


                        <div className="pt-2 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide flex justify-between">
                                <span>MongoDB URI</span>
                                {setupInfo.config?.hasEnvMongo ?
                                    <span className="text-[10px] font-normal text-green-600 lowercase italic">loaded from .env</span> :
                                    (setupInfo.config?.mongodbUri ? <span className="text-[10px] font-normal text-blue-600 lowercase italic">loaded from sqlite</span> : <span className="text-[10px] font-normal text-gray-400 lowercase italic">(optional if in env)</span>)
                                }
                            </label>
                            <div className="relative">
                                <Database className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    disabled={setupInfo.config?.hasEnvMongo || !!setupInfo.config?.mongodbUri}
                                    value={formData.mongodbUri}
                                    onChange={e => setFormData({ ...formData, mongodbUri: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#235a81] focus:ring-1 focus:ring-[#235a81] transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                    placeholder="mongodb://localhost:27017"
                                />
                            </div>
                            {setupInfo.config?.hasEnvMongo && <p className="text-[10px] text-green-600 mt-1 italic">Environment variable is active and cannot be changed here.</p>}
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#235a81] hover:bg-[#1a4461] text-white font-bold py-2.5 rounded shadow-sm text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
