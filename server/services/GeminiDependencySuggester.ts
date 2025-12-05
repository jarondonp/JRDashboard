import OpenAI from 'openai';

interface Task {
    id: string;
    title: string;
    description?: string;
    goal_title?: string;
    calculated_priority?: string;
}

export interface DependencySuggestion {
    taskId: string;
    taskTitle: string;
    taskGoal?: string; // Added goal context
    dependsOn: string;
    dependsOnTitle: string;
    dependsOnGoal?: string; // Added goal context
    confidence: number;
    reason: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export async function suggestDependencies(tasks: Task[]): Promise<DependencySuggestion[]> {
    try {
        console.log('\n🤖 ========== OPENAI DEPENDENCY SUGGESTER ==========');
        console.log('📥 Recibidas', tasks.length, 'tareas para analizar');

        // Create a map for quick task lookup to enrich suggestions later
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        const systemPrompt = `Eres un experto en gestión de proyectos. 
IMPORTANTE: Debes responder ÚNICAMENTE con JSON válido siguiendo EXACTAMENTE este esquema:
{
  "suggestions": [
    {"taskId": "...", "taskTitle": "...", "dependsOn": "...", "dependsOnTitle": "...", "confidence": 85, "reason": "..."}
  ]
}
NO agregues texto adicional, NO uses markdown, SOLO el objeto JSON.`;

        const userPrompt = `Analiza estas tareas y sugiere dependencias lógicas.
OBJETIVO: Identificar TODAS las dependencias lógicas posibles (especialmente dentro de la misma Meta).

TAREAS:
${tasks.map((t, i) => `${i + 1}. ID:${t.id} "${t.title}"${t.goal_title ? ` [Meta: ${t.goal_title}]` : ''}`).join('\n')}

REGLAS DE ANÁLISIS:
1. **Agrupación por Metas**: Las tareas dentro de la misma [Meta] suelen tener un orden secuencial. Analízalas en bloque.
2. **Patrones Lógicos**:
   - "Investigar/Planear" -> "Crear/Desarrollar" -> "Revisar/Validar" -> "Entregar/Publicar"
   - "Comprar" -> "Usar"
   - "Contactar" -> "Agendar" -> "Reunirse"
   - "Borrador" -> "Versión Final"
3. **Sentido Común**: Si la Tarea B necesita que la Tarea A exista primero, entonces B depende de A.

INSTRUCCIONES DE RESPUESTA:
- Genera tantas sugerencias válidas como encuentres (intenta encontrar al menos 10-15 si es posible).
- Mantén la confianza alta (solo >80%).
- La "reason" debe ser breve y clara.

Responde en este formato JSON EXACTO:
{
  "suggestions": [
    {
      "taskId": "el_id_exacto_de_la_tarea_hija",
      "taskTitle": "título de la tarea hija",
      "dependsOn": "el_id_exacto_de_la_tarea_padre",
      "dependsOnTitle": "título de la tarea padre",
      "confidence": 90,
      "reason": "Razón lógica breve"
    }
  ]
}

Si no hay sugerencias: {"suggestions": []}`;

        console.log('\n📤 Enviando prompt a OpenAI GPT-4...');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content || '{"suggestions":[]}';

        console.log('\n📥 Respuesta de OpenAI (primeros 800 caracteres):');
        console.log(responseText.substring(0, 800));

        const parsed = JSON.parse(responseText);
        const rawSuggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);

        console.log('\n✅ Sugerencias crudas recibidas:', rawSuggestions.length);

        // Enrich suggestions with Goal Titles and validate
        const validSuggestions: DependencySuggestion[] = [];

        if (Array.isArray(rawSuggestions)) {
            rawSuggestions.forEach((s: any) => {
                const task = taskMap.get(s.taskId);
                const dependency = taskMap.get(s.dependsOn);

                if (task && dependency && s.taskId !== s.dependsOn) {
                    validSuggestions.push({
                        taskId: s.taskId,
                        taskTitle: task.title, // Ensure we use the exact title from DB
                        taskGoal: task.goal_title, // Add Goal Title
                        dependsOn: s.dependsOn,
                        dependsOnTitle: dependency.title, // Ensure we use the exact title from DB
                        dependsOnGoal: dependency.goal_title, // Add Goal Title
                        confidence: s.confidence,
                        reason: s.reason
                    });
                    console.log(`  + "${task.title}" (${task.goal_title || 'No Goal'}) depende de "${dependency.title}" (${dependency.goal_title || 'No Goal'})`);
                }
            });
        }

        console.log('\n🎯 Sugerencias válidas enriquecidas:', validSuggestions.length);
        console.log('==================================================\n');

        return validSuggestions;
    } catch (error) {
        console.error('\n❌ Error en OpenAI Dependency Suggester:', error);
        console.error('==================================================\n');
        return [];
    }
}
