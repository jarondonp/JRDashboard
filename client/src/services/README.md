Servicios HTTP (client/src/services)

Resumen
- `apiClient.ts`: helpers genéricos para llamadas a la API (`apiGet`, `apiPost`, `apiPut`, `apiDelete`).
- `areasApi.ts`: funciones CRUD para `areas` (`fetchAreas`, `fetchArea`, `createArea`, `updateArea`, `deleteArea`).

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
- Implementar `goalsApi.ts`, `tasksApi.ts`, `progressApi.ts`, `documentsApi.ts`, `reportsApi.ts` siguiendo el mismo patrón.
- Crear hooks con React Query (`useAreas`, `useCreateArea`) en `client/src/hooks` para integrarlos con componentes.
- Marcar `client/src/services` en el README principal del proyecto con instrucciones de ejecución.
