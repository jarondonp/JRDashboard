import React from 'react';

interface ActivePlanModalProps {
    isOpen: boolean;
    planName: string;
    planDescription?: string;
    lastPhase: string;
    projectTitle: string;
    onContinue: () => void;
    onChangePlan: () => void;
}

const PHASE_LABELS: Record<string, string> = {
    'ingestion': 'Cargar Tareas',
    'prioritization': 'Priorizar',
    'dependencies': 'Dependencias',
    'estimation': 'Estimación',
    'preview': 'Revisión'
};

export function ActivePlanModal({
    isOpen,
    planName,
    planDescription,
    lastPhase,
    projectTitle,
    onContinue,
    onChangePlan
}: ActivePlanModalProps) {
    if (!isOpen) return null;

    const phaseLabel = PHASE_LABELS[lastPhase] || lastPhase;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📋</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            Plan Activo Detectado
                        </h2>
                        <p className="text-sm text-gray-600">
                            Tienes un plan en progreso para este proyecto
                        </p>
                    </div>
                </div>

                {/* Plan Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Proyecto
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {projectTitle}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Plan
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {planName}
                        </p>
                    </div>
                    {planDescription && (
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Descripción
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5">
                                {planDescription}
                            </p>
                        </div>
                    )}
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Última Fase
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                {phaseLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onChangePlan}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>←</span>
                        <span>Cambiar Plan</span>
                    </button>
                    <button
                        onClick={onContinue}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Continuar</span>
                        <span>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
