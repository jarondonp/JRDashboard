import React, { useState } from 'react';
import { PlannerTask } from '../types';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    newTasks: any[];
    onImport: (selectedTasks: any[]) => void;
}

export function SyncModal({ isOpen, onClose, newTasks, onImport }: SyncModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(newTasks.map(t => t.id)));

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

    const handleImport = () => {
        const tasksToImport = newTasks.filter(t => selectedIds.has(t.id));
        onImport(tasksToImport);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Actualizaciones Disponibles</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Se han encontrado {newTasks.length} nuevas tareas en el proyecto que no están en este plan.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-3">
                        {newTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => toggleTask(task.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedIds.has(task.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${selectedIds.has(task.id)
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'border-gray-300 bg-white'
                                        }`}>
                                        {selectedIds.has(task.id) && (
                                            <span className="text-white text-xs">✓</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${selectedIds.has(task.id) ? 'text-indigo-900' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                        onClick={handleImport}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Importar {selectedIds.size} Tareas
                    </button>
                </div>
            </div>
        </div>
    );
}
