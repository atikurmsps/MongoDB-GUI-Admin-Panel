'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertCircle, Save } from 'lucide-react';

interface EditDocumentModalProps {
    dbName: string;
    colName: string;
    document: any | null;
    onSaved: () => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function EditDocumentModal({
    dbName,
    colName,
    document,
    onSaved,
    trigger,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: EditDocumentModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

    const [jsonText, setJsonText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (document) {
            setJsonText(JSON.stringify(document, null, 2));
        } else {
            setJsonText('{\n  \n}');
        }
        setError('');
    }, [document, open]);

    const handleSave = async () => {
        setLoading(true);
        setError('');

        try {
            const parsedData = JSON.parse(jsonText);
            const isNew = !document;

            const res = await fetch('/api/mongodb/collections/data', {
                method: isNew ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    database: dbName,
                    collection: colName,
                    id: document?._id,
                    data: parsedData,
                }),
            });

            if (res.ok) {
                setOpen(false);
                onSaved();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save document');
            }
        } catch (err) {
            setError('Invalid JSON format');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl border border-gray-400">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
                        <Dialog.Title className="text-sm font-bold text-gray-700 uppercase">
                            {document ? 'Edit Document' : 'Insert New Document'}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-900">
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-4">
                        <div className="relative font-mono">
                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                className="w-full h-80 p-3 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none bg-gray-50"
                                spellCheck={false}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 p-2 border border-red-100 italic">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <p className="text-[10px] text-gray-500 italic">* Use valid JSON format. _id cannot be changed manually during update.</p>
                            <div className="flex gap-2">
                                <Dialog.Close asChild>
                                    <button type="button" className="bg-gray-100 px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-200">
                                        Cancel
                                    </button>
                                </Dialog.Close>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-5 py-1.5 text-xs rounded border border-blue-700 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
