'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Key, Loader2, Save, Lock } from 'lucide-react';

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || 'Failed to change password');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60 text-sans">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4 flex items-center justify-between border-b border-gray-300 pb-2">
                        <h1 className="text-xl font-normal text-gray-800 flex items-center gap-2">
                            <Key className="h-5 w-5 text-gray-500" />
                            Security Settings
                        </h1>
                    </header>

                    <div className="max-w-md mx-auto mt-10">
                        <div className="bg-white border border-gray-300 rounded-sm shadow-xl overflow-hidden">
                            <div className="bg-[#f8f8f8] border-b border-gray-200 px-6 py-3 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-blue-600" />
                                <h2 className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Change Password</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {error && (
                                    <div className="p-3 border border-red-200 bg-red-50 rounded-sm text-red-700 text-[11px] font-medium italic animate-in fade-in slide-in-from-top-1">
                                        * {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 border border-green-200 bg-green-50 rounded-sm text-green-700 text-[11px] font-bold animate-in fade-in slide-in-from-top-1">
                                        ✓ {success}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Current Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-sm bg-[#fcfcfc] px-3 py-2 text-[13px] text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">New Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-sm bg-[#fcfcfc] px-3 py-2 text-[13px] text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Confirm New Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-sm bg-[#fcfcfc] px-3 py-2 text-[13px] text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center rounded-sm bg-blue-600 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg border border-blue-700 hover:bg-blue-700 transition-all disabled:opacity-50 gap-2"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {loading ? 'Changing...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
