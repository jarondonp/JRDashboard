import React, { useState, useEffect } from 'react';

interface Goal {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
}

interface GoalSelectorProps {
    projectId: string;
    onGoalsSelected: (goalIds: string[]) => void;
    onCancel: () => void;
    initialSelectedGoals?: string[]; // Metas ya seleccionadas en el plan
}

export function GoalSelector({ projectId, onGoalsSelected, onCancel, initialSelectedGoals }: GoalSelectorProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [includeNoGoal, setIncludeNoGoal] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const res = await fetch(`/api/planner/projects/${projectId}/goals`);
                if (res.ok) {
                    const data = await res.json();
                    setGoals(data);
                    // Use initialSelectedGoals if provided, otherwise select all
                    if (initialSelectedGoals && initialSelectedGoals.length > 0) {
                        // Only select goals that are in initialSelectedGoals AND exclude 'NO_GOAL'
                        const validGoalIds = initialSelectedGoals.filter(id => id !== 'NO_GOAL');
                        setSelectedGoals(new Set(validGoalIds));
                        // Check if NO_GOAL was in the initial selection
                        setIncludeNoGoal(initialSelectedGoals.includes('NO_GOAL'));
                    } else {
                        // Default: select all goals
                        setSelectedGoals(new Set(data.map((g: Goal) => g.id)));
                    }
                }
            } catch (err) {
                console.error('Error fetching goals:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, [projectId, initialSelectedGoals]);

    const toggleGoal = (goalId: string) => {
        const newSelected = new Set(selectedGoals);
        if (newSelected.has(goalId)) {
            newSelected.delete(goalId);
        } else {
            newSelected.add(goalId);
        }
        setSelectedGoals(newSelected);
    };

    const handleContinue = () => {
        const result = Array.from(selectedGoals);
        if (includeNoGoal) {
            result.push('NO_GOAL');
        }
        onGoalsSelected(result);
    };

    const toggleAll = () => {
        if (selectedGoals.size === goals.length) {
            setSelectedGoals(new Set());
        } else {
            setSelectedGoals(new Set(goals.map(g => g.id)));
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando metas...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Definir Alcance del Plan</h2>
                    <p className="text-gray-600 mt-1">Selecciona las metas que deseas incluir en este plan.</p>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={toggleAll}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        {selectedGoals.size === goals.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </button>
                    <span className="text-sm text-gray-500">
                        {selectedGoals.size} metas seleccionadas
                    </span>
                </div>

                <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                    {goals.map(goal => (
                        <div
                            key={goal.id}
                            onClick={() => toggleGoal(goal.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedGoals.has(goal.id)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${selectedGoals.has(goal.id)
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300 bg-white'
                                    }`}>
                                    {selectedGoals.has(goal.id) && (
                                        <span className="text-white text-xs">✓</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-medium ${selectedGoals.has(goal.id) ? 'text-indigo-900' : 'text-gray-900'}`}>
                                        {goal.title}
                                    </h3>
                                    {goal.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                            {goal.description}
                                        </p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {goal.status}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {goal.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {goals.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            No hay metas definidas para este proyecto.
                        </div>
                    )}

                    <div
                        onClick={() => setIncludeNoGoal(!includeNoGoal)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all mt-4 ${includeNoGoal
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${includeNoGoal
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300 bg-white'
                                }`}>
                                {includeNoGoal && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div>
                                <h3 className={`font-medium ${includeNoGoal ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    Tareas sin meta asignada
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Incluir tareas sueltas que no pertenecen a ninguna meta específica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        Volver
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={selectedGoals.size === 0 && !includeNoGoal}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                        Cargar Tareas ({selectedGoals.size + (includeNoGoal ? 1 : 0)})
                    </button>
                </div>
            </div>
        </div>
    );
}
