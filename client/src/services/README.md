Servicios HTTP (client/src/services)

Resumen
- `apiClient.ts`: helpers genéricos para llamadas a la API (`apiGet`, `apiPost`, `apiPut`, `apiDelete`).
- `areasApi.ts`: funciones CRUD para `areas` (`fetchAreas`, `fetchArea`, `createArea`, `updateArea`, `deleteArea`).
 - `goalsApi.ts`: funciones CRUD para `goals` (`fetchGoals`, `fetchGoal`, `createGoal`, `updateGoal`, `deleteGoal`).
 - `tasksApi.ts`: funciones CRUD para `tasks` (`fetchTasks`, `fetchTask`, `createTask`, `updateTask`, `deleteTask`).
 - `progressApi.ts`: funciones CRUD para `progress-logs` (`fetchProgressLogs`, `fetchProgressLog`, `createProgressLog`, `updateProgressLog`, `deleteProgressLog`).
 - `documentsApi.ts`: funciones CRUD para `documents` (`fetchDocuments`, `fetchDocument`, `createDocument`, `updateDocument`, `deleteDocument`).
 - `reportsApi.ts`: funciones CRUD para `reports` (`fetchReports`, `fetchReport`, `createReport`, `updateReport`, `deleteReport`).

Uso rápido (ejemplos)

- Fetch todas las áreas (fetch dentro de un hook o efecto):

```ts
import { fetchAreas } from './services/areasApi';

async function load() {
  const areas = await fetchAreas();
  console.log(areas);
}
```

- Crear una nueva área:

```ts
import { createArea } from './services/areasApi';

await createArea({ name: 'Salud', type: 'Personal', color: '#ff0000', description: 'Área de salud' });
```

Ejemplo cURL (desde terminal):

```bash
curl -X GET http://localhost:5000/api/areas

curl -X POST http://localhost:5000/api/areas \
  -H "Content-Type: application/json" \
  -d '{"name":"Nueva","type":"Personal","color":"#00ff00"}'
```

Siguientes pasos recomendados
- Ya implementadas: `goalsApi.ts`, `tasksApi.ts`, `progressApi.ts`, `documentsApi.ts`, `reportsApi.ts`.
- Hooks: se añadieron hooks de React Query en `client/src/hooks`:
  - `useAreas`, `useCreateArea`, `useUpdateArea`, `useDeleteArea`
  - `useGoals`, `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`
  - `useTasks`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`
  - `useProgressLogs`, `useCreateProgressLog`, `useUpdateProgressLog`, `useDeleteProgressLog`
  - `useDocuments`, `useCreateDocument`, `useUpdateDocument`, `useDeleteDocument`
  - `useReports`, `useCreateReport`, `useUpdateReport`, `useDeleteReport`
- Marcar `client/src/services` en el README principal del proyecto con instrucciones de ejecución.
