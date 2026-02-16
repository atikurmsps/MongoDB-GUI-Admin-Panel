'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';

export default function ImportModal({ dbName, onImported }: { dbName: string, onImported: () => void }) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setError('');

        try {
            const text = await file.text();

            const res = await fetch(`/api/mongodb/import?db=${dbName}`, {
                method: 'POST',
                body: text,
            });

            if (res.ok) {
                setOpen(false);
                setFile(null);
                onImported();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to import database');
            }
        } catch (err) {
            setError('Invalid JSON file format');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-1.5 bg-gray-200 px-3 py-1 text-xs border border-gray-400 rounded hover:bg-gray-300">
                    <Upload className="h-3.5 w-3.5" /> Import
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl border border-gray-400">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
                        <Dialog.Title className="text-sm font-bold text-gray-700 uppercase">Import Database</Dialog.Title>
                        <Dialog.Description className="sr-only">
                            Choose a MongoDB dump file in JSON format to import data into the current database.
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-900">
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[11px] text-gray-600">Select a JSON dump file to import into <b>{dbName}</b>.</p>

                        <div className="border-2 border-dashed border-gray-200 p-4 text-center rounded">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                                id="import-file"
                            />
                            <label
                                htmlFor="import-file"
                                className="cursor-pointer text-[12px] text-blue-600 hover:underline flex flex-col items-center gap-2"
                            >
                                <Upload className="h-6 w-6 text-gray-400" />
                                {file ? file.name : 'Choose a file...'}
                            </label>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-[10px] text-red-600 bg-red-50 p-2 border border-red-100 italic">
                                <AlertCircle className="h-3 w-3" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Dialog.Close asChild>
                                <button type="button" className="bg-gray-100 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="bg-blue-600 text-white px-4 py-1 text-xs rounded border border-blue-700 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Import
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
