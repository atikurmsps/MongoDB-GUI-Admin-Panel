'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, Loader2 } from 'lucide-react';

export default function CreateDbModal({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/mongodb/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                setOpen(false);
                setName('');
                onCreated();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create database');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                    <Plus className="h-4 w-4" />
                    Create Database
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl border border-gray-400">
                    <div className="mb-6 flex items-center justify-between">
                        <Dialog.Title className="text-xl font-bold text-gray-900">New Database</Dialog.Title>
                        <Dialog.Description className="sr-only">
                            Provide a name for the new MongoDB database you wish to create.
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="dbName" className="text-sm font-medium text-gray-700">
                                Database Name
                            </label>
                            <input
                                id="dbName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                                placeholder="my_awesome_db"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end gap-3">
                            <Dialog.Close asChild>
                                <button type="button" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
