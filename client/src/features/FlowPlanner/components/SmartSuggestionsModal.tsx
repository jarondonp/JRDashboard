import { useState, useEffect } from 'react';
import { usePlanner } from '../PlannerContext';

interface DependencySuggestion {
    taskId: string;
    taskTitle: string;
    taskGoal?: string;
    dependsOn: string;
    dependsOnTitle: string;
    dependsOnGoal?: string;
    confidence: number;
    reason: string;
}

interface SmartSuggestionsModalProps {
    onClose: () => void;
    onApplySuggestion: (taskId: string, dependsOn: string) => void;
}

export function SmartSuggestionsModal({ onClose, onApplySuggestion }: SmartSuggestionsModalProps) {
    const { state } = usePlanner();
    const [suggestions, setSuggestions] = useState<DependencySuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('📤 Enviando tareas a OpenAI:', state.tasks.length, 'tareas');
            console.log('Tareas:', state.tasks.map(t => ({ id: t.id, title: t.title, goal: t.goal_title })));

            const response = await fetch('/api/planner/suggest-dependencies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: state.tasks }),
            });

            if (!response.ok) throw new Error('Error fetching suggestions');

            const data = await response.json();
            console.log('📥 Respuesta de OpenAI:', data);
            console.log('Sugerencias recibidas:', data.suggestions?.length || 0);

            setSuggestions(data.suggestions || []);
        } catch (err) {
            console.error('❌ Error al obtener sugerencias:', err);
            setError('Error al obtener sugerencias. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (suggestion: DependencySuggestion) => {
        onApplySuggestion(suggestion.taskId, suggestion.dependsOn);
        setAppliedSuggestions(prev => new Set(prev).add(`${suggestion.taskId}-${suggestion.dependsOn}`));
    };

    const handleApplyAll = () => {
        suggestions.forEach(suggestion => {
            const key = `${suggestion.taskId}-${suggestion.dependsOn}`;
            if (!appliedSuggestions.has(key)) {
                handleApply(suggestion);
            }
        });
    };

    const handleIgnore = (suggestion: DependencySuggestion) => {
        setSuggestions(prev => prev.filter(s =>
            !(s.taskId === suggestion.taskId && s.dependsOn === suggestion.dependsOn)
        ));
    };

    // Auto-fetch on mount
    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">🧠 Sugerencias Inteligentes</h2>
                        <p className="text-sm text-gray-600 mt-1">Powered by OpenAI GPT-4</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-600 mt-4">Analizando tareas con IA...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-800">{error}</p>
                            <button
                                onClick={fetchSuggestions}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && suggestions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">✨ No hay sugerencias de dependencias en este momento.</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Las tareas actuales parecen ser independientes o ya tienen dependencias bien definidas.
                            </p>
                        </div>
                    )}

                    {!loading && suggestions.length > 0 && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-600">
                                    {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''} encontrada{suggestions.length !== 1 ? 's' : ''}
                                </p>
                                <button
                                    onClick={handleApplyAll}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    Aplicar Todas
                                </button>
                            </div>

                            <div className="space-y-3">
                                {suggestions.map((suggestion, index) => {
                                    const isApplied = appliedSuggestions.has(`${suggestion.taskId}-${suggestion.dependsOn}`);

                                    return (
                                        <div
                                            key={`${suggestion.taskId}-${suggestion.dependsOn}-${index}`}
                                            className={`border rounded-lg p-4 ${isApplied ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="mb-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-gray-900">"{suggestion.taskTitle}"</span>
                                                            {suggestion.taskGoal && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                                    Meta: {suggestion.taskGoal}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                                                        <span>→ depende de:</span>
                                                        <span className="font-medium">"{suggestion.dependsOnTitle}"</span>
                                                        {suggestion.dependsOnGoal && (
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                Meta: {suggestion.dependsOnGoal}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 ml-4">
                                                    <span className="text-xs text-gray-500">Confianza:</span>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-2 w-2 rounded-full ${i < Math.round(suggestion.confidence / 20) ? 'bg-indigo-600' : 'bg-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-medium text-indigo-600 ml-1">
                                                        {suggestion.confidence}%
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>

                                            <div className="flex gap-2">
                                                {isApplied ? (
                                                    <span className="text-sm text-green-600 font-medium">✓ Aplicada</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleApply(suggestion)}
                                                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                                                        >
                                                            ✓ Aplicar
                                                        </button>
                                                        <button
                                                            onClick={() => handleIgnore(suggestion)}
                                                            className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors"
                                                        >
                                                            ✗ Ignorar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
