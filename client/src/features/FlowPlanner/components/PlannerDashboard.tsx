import React, { useState, useEffect } from 'react';
import { usePlanner } from '../PlannerContext';

interface PlanSummary {
    id: string;
    name: string;
    description?: string;
    updated_at: string;
    current_phase: string;
}

interface PlannerDashboardProps {
    onPlanSelected: () => void;
}

export function PlannerDashboard({ onPlanSelected }: PlannerDashboardProps) {
    const { state, loadPlan, createPlan, setProjectId, setProjectTitle, setProjectStartDate, loadTasks } = usePlanner();
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewPlanForm, setShowNewPlanForm] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');

    useEffect(() => {
        if (state.project_id) {
            loadPlans();
        }
    }, [state.project_id]);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/planner/projects/${state.project_id}/plans`);
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (err) {
            console.error('Error loading plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlanName.trim()) return;

        setLoading(true);
        const planId = await createPlan(newPlanName, newPlanDesc);
        if (planId) {
            onPlanSelected();
        }
        setLoading(false);
    };

    const handleSelectPlan = async (planId: string) => {
        setLoading(true);
        const success = await loadPlan(planId);
        if (success) {
            onPlanSelected();
        }
        setLoading(false);
    };

    const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar este plan?')) return;

        try {
            await fetch(`/api/planner/plans/${planId}`, { method: 'DELETE' });
            loadPlans();
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Planes del Proyecto</h2>
                    <p className="text-gray-600">Gestiona diferentes escenarios para {state.project_title}</p>
                </div>
                <button
                    onClick={() => setShowNewPlanForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    + Nuevo Plan
                </button>
            </div>

            {showNewPlanForm && (
                <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-indigo-100">
                    <h3 className="text-lg font-semibold mb-4">Crear Nuevo Escenario</h3>
                    <form onSubmit={handleCreatePlan}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
                            <input
                                type="text"
                                value={newPlanName}
                                onChange={e => setNewPlanName(e.target.value)}
                                placeholder="Ej: Plan Optimista, Plan Q1..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                            <textarea
                                value={newPlanDesc}
                                onChange={e => setNewPlanDesc(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewPlanForm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!newPlanName.trim() || loading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : 'Crear Plan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map(plan => (
                    <div
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group relative"
                    >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => handleDeletePlan(plan.id, e)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Eliminar plan"
                            >
                                🗑️
                            </button>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{plan.name}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
                            {plan.description || 'Sin descripción'}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                            <span>Fase: {plan.current_phase}</span>
                            <span>{formatDate(plan.updated_at)}</span>
                        </div>
                    </div>
                ))}

                {plans.length === 0 && !loading && !showNewPlanForm && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 mb-2">No hay planes guardados para este proyecto.</p>
                        <button
                            onClick={() => setShowNewPlanForm(true)}
                            className="text-indigo-600 font-medium hover:underline"
                        >
                            Crear el primer plan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
