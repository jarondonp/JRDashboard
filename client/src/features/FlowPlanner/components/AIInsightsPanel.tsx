import React from 'react';

interface Recommendation {
    action: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

interface AnalysisResult {
    summary: string;
    health_score: number;
    root_causes: string[];
    forecast: string;
    recommendations: Recommendation[];
}

interface AIInsightsPanelProps {
    isOpen: boolean;
    isLoading: boolean;
    data: AnalysisResult | null;
    onClose: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ isOpen, isLoading, data, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>✨</span> Inteligencia de Proyecto
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="text-gray-500 font-medium">Analizando dependencias y ruta crítica...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Summary & Health */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">Estado de Salud</span>
                                <span className={`text-2xl font-bold ${getHealthColor(data.health_score)}`}>{data.health_score}/100</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                "{data.summary}"
                            </p>
                            <div className="mt-3 text-xs bg-white/60 p-2 rounded border border-indigo-100">
                                📅 <strong>Pronóstico:</strong> {data.forecast}
                            </div>
                        </div>

                        {/* Root Causes */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                🔍 Causas Raíz Detectadas
                            </h4>
                            <ul className="space-y-2">
                                {data.root_causes.map((cause, idx) => (
                                    <li key={idx} className="text-sm text-gray-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {cause}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                💡 Recomendaciones de IA
                            </h4>
                            <div className="space-y-3">
                                {data.recommendations.map((rec, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-gray-800 text-sm">{rec.action}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getImpactBadge(rec.impact)}`}>
                                                {rec.impact} Impact
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{rec.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No se pudo generar el análisis. Intenta nuevamente.
                    </div>
                )}
            </div>
        </div>
    );
};

const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
};

const getImpactBadge = (impact: string) => {
    switch (impact) {
        case 'High': return 'bg-green-100 text-green-700';
        case 'Medium': return 'bg-blue-100 text-blue-700';
        case 'Low': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};
