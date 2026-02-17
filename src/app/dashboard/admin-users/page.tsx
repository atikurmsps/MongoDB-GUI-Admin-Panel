'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { UserCircle, Plus, Trash2, Edit2, Loader2, Shield, User, Lock, Database as DbIcon, Check } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [availableDbs, setAvailableDbs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'editor',
        allowed_databases: '*'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchSession = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (res.ok) setCurrentUser(data);
        } catch (e) { }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin-users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDbs = async () => {
        try {
            const res = await fetch('/api/mongodb/databases');
            const data = await res.json();
            if (Array.isArray(data)) setAvailableDbs(data);
        } catch (e) { }
    };

    useEffect(() => {
        fetchSession();
        fetchUsers();
        fetchAvailableDbs();
    }, []);

    const canManageAll = currentUser?.role === 'admin';
    const canManageUser = (targetUser: any) => {
        if (!currentUser || currentUser.role !== 'admin') return false;
        if (currentUser.username === targetUser.username) return false;
        return true;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const method = editingUser ? 'PATCH' : 'POST';
            const body = editingUser ? { ...formData, id: editingUser.id } : formData;

            const res = await fetch('/api/admin-users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save user');

            setModalOpen(false);
            setEditingUser(null);
            setFormData({ username: '', password: '', role: 'editor', allowed_databases: '*' });
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/admin-users?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            allowed_databases: user.allowed_databases || '*'
        });
        setModalOpen(true);
    };

    const toggleDb = (dbName: string) => {
        let current = formData.allowed_databases;
        if (current === '*') {
            setFormData({ ...formData, allowed_databases: dbName });
            return;
        }

        const dbs = current.split(',').map(d => d.trim()).filter(Boolean);
        if (dbs.includes(dbName)) {
            const filtered = dbs.filter(d => d !== dbName);
            setFormData({ ...formData, allowed_databases: filtered.length === 0 ? '*' : filtered.join(',') });
        } else {
            setFormData({ ...formData, allowed_databases: [...dbs, dbName].join(',') });
        }
    };

    const isDbSelected = (dbName: string) => {
        if (formData.allowed_databases === '*') return true;
        return formData.allowed_databases.split(',').map(d => d.trim()).includes(dbName);
    };

    return (
        <div className="flex min-h-screen bg-[#f3f3f3]">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-60 text-sans">
                <Topbar />
                <main className="p-4 overflow-auto">
                    <header className="mb-4 flex items-center justify-between border-b border-gray-300 pb-2">
                        <h1 className="text-xl font-normal text-gray-800 flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-gray-500" />
                            System Users
                        </h1>
                        {canManageAll && (
                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setFormData({ username: '', password: '', role: 'editor', allowed_databases: '*' });
                                    setModalOpen(true);
                                }}
                                className="bg-[#235a81] text-white px-3 py-1.5 rounded-sm text-xs hover:bg-[#1a4461] transition-colors flex items-center gap-1.5 font-bold uppercase tracking-tight shadow-sm"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add User
                            </button>
                        )}
                    </header>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-[11px] text-left">
                                <thead className="bg-[#f0f0f0] border-b border-gray-300 text-gray-700 uppercase tracking-tighter font-bold">
                                    <tr>
                                        <th className="px-4 py-2 border-r border-gray-200">ID</th>
                                        <th className="px-4 py-2 border-r border-gray-200">Username</th>
                                        <th className="px-4 py-2 border-r border-gray-200">Role</th>
                                        <th className="px-4 py-2 border-r border-gray-200">Allowed Databases</th>
                                        <th className="px-4 py-2 border-r border-gray-200">Created At</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => {
                                        const isSelf = currentUser?.username === user.username;
                                        const allowed = canManageUser(user);

                                        return (
                                            <tr key={user.id} className={`hover:bg-blue-50/50 transition-colors group ${isSelf ? 'bg-blue-50/30' : ''}`}>
                                                <td className="px-4 py-2 text-gray-400 font-mono">{user.id}</td>
                                                <td className="px-4 py-2 font-bold text-blue-800 flex items-center gap-2">
                                                    {user.username}
                                                    {isSelf && <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded-full font-bold uppercase py-0.5">You</span>}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                            user.role === 'editor' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-mono text-gray-600">
                                                    {user.allowed_databases === '*' ? (
                                                        <span className="text-green-600 font-bold">ALL (*)</span>
                                                    ) : (
                                                        <span className="flex flex-wrap gap-1">
                                                            {user.allowed_databases.split(',').map((db: string) => (
                                                                <span key={db} className="bg-gray-100 px-1.5 py-0.5 rounded-sm border border-gray-200 text-gray-500">
                                                                    {db.trim()}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 italic">{new Date(user.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right space-x-2">
                                                    {allowed ? (
                                                        <>
                                                            <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 p-1 opacity-60 hover:opacity-100">
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 p-1 opacity-60 hover:opacity-100">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 italic pr-2">
                                                            {isSelf ? "N/A" : "Restricted"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-gray-400 italic">No admin users found in database</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-white rounded-sm shadow-2xl border border-gray-300 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#235a81] px-4 py-2.5 border-b border-gray-400 text-white text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                            {editingUser ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {editingUser ? 'Edit System User' : 'Add New System User'}
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && <div className="p-2 border border-red-200 bg-red-50 text-red-600 text-[11px] rounded-sm italic">* {error}</div>}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Username</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-sm text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-[#fcfcfc]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                    {editingUser ? 'New Password (Optional)' : 'Password'}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        required={!editingUser}
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-sm text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-[#fcfcfc]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-sm text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-[#fcfcfc] appearance-none"
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter flex items-center justify-between">
                                    Allowed Databases
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, allowed_databases: formData.allowed_databases === '*' ? '' : '*' })}
                                        className="text-[9px] text-blue-600 hover:underline font-bold"
                                    >
                                        {formData.allowed_databases === '*' ? 'Custom Selection' : 'Allow All (*)'}
                                    </button>
                                </label>

                                {formData.allowed_databases === '*' ? (
                                    <div className="p-3 border border-green-100 bg-green-50/50 rounded-sm text-[11px] text-green-700 flex items-center gap-2 italic">
                                        <Check className="h-3.5 w-3.5" /> All databases are currently allowed.
                                    </div>
                                ) : (
                                    <div className="border border-gray-200 rounded-sm bg-[#fcfcfc] max-h-32 overflow-y-auto divide-y divide-gray-100">
                                        {availableDbs.map(db => {
                                            const selected = isDbSelected(db.name);
                                            return (
                                                <div
                                                    key={db.name}
                                                    onClick={() => toggleDb(db.name)}
                                                    className={`px-3 py-2 text-[11px] flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${selected ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <DbIcon className={`h-3 w-3 ${selected ? 'text-blue-500' : 'text-gray-400'}`} />
                                                        <span className={selected ? 'font-bold text-blue-800' : 'text-gray-600'}>{db.name}</span>
                                                    </div>
                                                    {selected && <Check className="h-3 w-3 text-blue-600" />}
                                                </div>
                                            );
                                        })}
                                        {availableDbs.length === 0 && (
                                            <div className="p-4 text-center text-gray-400 italic text-[10px]">No databases found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-3 py-2 border border-gray-300 text-[11px] font-bold uppercase text-gray-600 rounded-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white px-3 py-2 text-[11px] font-bold uppercase rounded-sm shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
