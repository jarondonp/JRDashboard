import OpenAI from 'openai';

interface TaskSummary {
    id: string;
    title: string;
    start: string;
    due: string;
    delay?: number;
    status: string;
}

export interface AnalysisInput {
    projectTitle: string;
    baselineTasks: TaskSummary[];
    currentTasks: TaskSummary[];
}

export interface Recommendation {
    action: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

export interface AnalysisResult {
    summary: string;
    health_score: number;
    root_causes: string[];
    forecast: string;
    recommendations: Recommendation[];
}

// Lazy init to ensure env is loaded
const getOpenAI = () => new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export async function analyzeDeviation(input: AnalysisInput): Promise<AnalysisResult> {
    try {
        console.log(`🤖 [AI Analysis] Analyzing ${input.projectTitle} with ${input.currentTasks.length} tasks`);

        // Filter only relevant tasks to reduce token usage (e.g., delayed or high impact)
        // For now, send simple summary of all
        const tasksPayload = input.currentTasks.map(t => {
            const baseline = input.baselineTasks.find(b => b.id === t.id);
            const delay = t.delay || 0;
            return {
                title: t.title,
                planned_end: baseline?.due || 'N/A',
                actual_end: t.due,
                delay_days: delay,
                status: t.status
            };
        });

        const systemPrompt = `Eres un Project Manager Experto (PMP).
Tu objetivo es analizar el estado de un proyecto comparando su Línea Base (Plan Original) con la Ejecución Actual.

Responde ÚNICAMENTE con JSON válido en este formato:
{
  "summary": "Resumen ejecutivo de 1 linea sobre el estado del proyecto.",
  "health_score": 85,
  "root_causes": ["Causa 1", "Causa 2"],
  "forecast": "Predicción de fecha de fin basada en el ritmo actual.",
  "recommendations": [
    { "action": "Nombre Acción Intuitivo", "description": "Descripción breve", "impact": "High" }
  ]
}`;

        const userPrompt = `Proyecto: "${input.projectTitle}"
        
ESTADO DE LAS TAREAS:
${JSON.stringify(tasksPayload, null, 2)}

INSTRUCCIONES:
1. Identifica el retraso general y su impacto.
2. Encuentra la "Causa Raíz" (ej: Tareas que retrasaron a otras).
3. Calcula un "Health Score" (0-100) donde 100 es perfecto a tiempo.
4. Genera 3 recomendaciones concretas para recuperar el tiempo (Fast-tracking, Crashing, Recorte de alcance).
5. Sé directo y profesional.`;

        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const result = JSON.parse(responseText) as AnalysisResult;

        return {
            summary: result.summary || 'Análisis no disponible',
            health_score: result.health_score || 50,
            root_causes: result.root_causes || [],
            forecast: result.forecast || 'Sin pronóstico',
            recommendations: result.recommendations || []
        };

    } catch (error) {
        console.error('❌ Error in AI Analysis:', error);
        return {
            summary: 'Error generando análisis inteligente.',
            health_score: 0,
            root_causes: ['Error de conexión con IA'],
            forecast: 'N/A',
            recommendations: []
        };
    }
}
