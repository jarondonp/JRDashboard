import React, { useState } from 'react';
import { PlannerTask } from '../types';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    syncData: {
        newTasks: any[];
        existingTasksUpdates: any[];
    } | null;
    onConfirmSync: (options: { importNew: boolean; updateReal: boolean }, selectedNewTasks: any[]) => void;
}

export function SyncModal({ isOpen, onClose, syncData, onConfirmSync }: SyncModalProps) {
    const newTasks = syncData?.newTasks || [];
    const existingUpdates = syncData?.existingTasksUpdates || [];

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(newTasks.map(t => t.id)));
    const [importNew, setImportNew] = useState(true);
    const [updateReal, setUpdateReal] = useState(false);

    // Initial effect to default check "Update Real" if only updates are available? 
    // Or let user decide. Defaulting New to true is standard.

    if (!isOpen) return null;

    const toggleTask = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        if (!importNew && !updateReal) return;

        const tasksToImport = newTasks.filter(t => selectedIds.has(t.id));
        onConfirmSync({ importNew, updateReal }, tasksToImport);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Sincronización de Proyecto</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Elige qué datos deseas traer de la ejecución real a tu plan.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Option 1: Import New Tasks */}
                    <div className={`p-4 rounded-lg border transition-colors ${importNew ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 text-indigo-600 rounded"
                                checked={importNew}
                                onChange={(e) => setImportNew(e.target.checked)}
                                disabled={newTasks.length === 0}
                            />
                            <div>
                                <h3 className="font-medium text-gray-900">Importar Tareas Nuevas</h3>
                                <p className="text-sm text-gray-500">
                                    {newTasks.length > 0
                                        ? `Se encontraron ${newTasks.length} tareas nuevas creadas fuera del plan.`
                                        : 'No hay tareas nuevas.'}
                                </p>
                            </div>
                        </label>

                        {/* Task List (Only visible if checked and has tasks) */}
                        {importNew && newTasks.length > 0 && (
                            <div className="mt-4 pl-8 max-h-40 overflow-y-auto pr-2">
                                <div className="space-y-2">
                                    {newTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-100">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(task.id)}
                                                onChange={() => toggleTask(task.id)}
                                                className="rounded text-indigo-600"
                                            />
                                            <span className="truncate">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Option 2: Update Real Status */}
                    <div className={`p-4 rounded-lg border transition-colors ${updateReal ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 text-amber-600 rounded"
                                checked={updateReal}
                                onChange={(e) => setUpdateReal(e.target.checked)}
                            />
                            <div>
                                <h3 className="font-medium text-gray-900">Actualizar Estado Real (Reset)</h3>
                                <p className="text-sm text-gray-500">
                                    Sobrescribir las fechas y estados de tu plan con la realidad actual de la base de datos.
                                    <br />
                                    <span className="text-xs font-semibold text-amber-700">⚠️ Esto reemplazará tus simulaciones no guardadas.</span>
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!importNew && !updateReal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                    >
                        Confirmar Sincronización
                    </button>
                </div>
            </div>
        </div>
    );
}
