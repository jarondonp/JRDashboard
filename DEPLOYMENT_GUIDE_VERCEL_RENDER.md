# 📘 Guía de Implementación: Estrategia Híbrida (Vercel + Render)

Esta guía detalla el procedimiento paso a paso para desplegar **MindsetApp 360°** separando el Frontend (Vercel) del Backend (Render). Esta arquitectura es la más robusta para soportar tus futuras fases de IA y Analytics.

---

## 📋 Fase 1: Preparación del Código (Local)

Antes de subir nada, debemos asegurarnos de que el código sepa comportarse en dos lugares distintos.

1.  **Ajuste de CORS en Backend:**
    *   Actualmente, tu servidor probablemente acepta peticiones de `localhost`.
    *   *Acción:* Deberás configurar el middleware de CORS en Express para que acepte peticiones desde tu futuro dominio de Vercel (ej: `https://mindset-app.vercel.app`).

2.  **Variables de Entorno Dinámicas:**
    *   El frontend no puede tener la URL del backend "quemada" en el código (hardcoded).
    *   *Acción:* Asegurar que el cliente use `import.meta.env.VITE_API_URL` para todas las llamadas a la API.

3.  **Scripts de Build Separados:**
    *   Tu `package.json` raíz debe tener scripts claros para construir cada parte por separado.
    *   *Acción:* Verificar que existan comandos como `build:client` (que corra vite build) y `build:server` (que compile el TS del server).

---

## 🚀 Fase 2: Despliegue del Backend (Render)

El cerebro de la aplicación va primero, porque el frontend necesita saber a dónde conectarse.

1.  **Crear Web Service en Render:**
    *   Conectas tu repositorio de GitHub.
    *   Seleccionas la carpeta raíz del proyecto.

2.  **Configuración de Build y Start:**
    *   **Build Command:** `npm install && npm run build:server`
        *   *Explicación:* Instala dependencias y compila el TypeScript del servidor a JavaScript.
    *   **Start Command:** `npm run start:server`
        *   *Explicación:* Ejecuta el archivo compilado (ej: `node dist/index.js`).

3.  **Variables de Entorno (Environment):**
    *   `DATABASE_URL`: Pegas la conexión string de **Neon** (la misma que tienes en tu `.env` local).
    *   `NODE_ENV`: `production`.
    *   `PORT`: `10000` (o el que Render asigne por defecto).

4.  **Resultado:**
    *   Render te dará una URL pública: `https://mindset-api.onrender.com`.
    *   *Nota:* Este servidor "dormirá" si usas el plan gratuito. Para producción real, se recomienda el plan "Starter" ($7/mes) para que siempre esté despierto.

---

## ⚡ Fase 3: Despliegue del Frontend (Vercel)

La cara de la aplicación.

1.  **Importar Proyecto en Vercel:**
    *   Conectas tu repositorio de GitHub.
    *   Vercel detectará automáticamente que es un proyecto **Vite**.

2.  **Configuración del Directorio:**
    *   **Root Directory:** Deberás indicar `client` (si tu frontend vive en una subcarpeta) o la raíz si está mezclado.
    *   *Recomendación:* Si es un monorepo, configura el "Root Directory" en `client`.

3.  **Variables de Entorno:**
    *   `VITE_API_URL`: Aquí pegas la URL que te dio Render en el paso anterior (`https://mindset-api.onrender.com`).
    *   *Importante:* Vercel inyectará esta variable en tiempo de construcción.

4.  **Despliegue:**
    *   Clic en "Deploy". Vercel construirá el sitio estático y lo distribuirá en su CDN global.

---

## 🔗 Fase 4: Conexión Final y Verificación

1.  **Cerrar el Círculo de Seguridad:**
    *   Vuelves a Render (Backend).
    *   Actualizas la configuración de CORS para permitir explícitamente el dominio que Vercel te acaba de dar (ej: `https://mindset-app-javier.vercel.app`).
    *   Esto evita que otros sitios usen tu API.

2.  **Prueba de Humo (Smoke Test):**
    *   Abres la URL de Vercel.
    *   Intentas hacer login (si hubiera) o cargar el Dashboard.
    *   Verificas en la consola del navegador (Network tab) que las peticiones van hacia Render y regresan con éxito (Status 200).

---

## 🔮 Proyección a Futuro (IA y Analytics)

¿Por qué hicimos todo esto así?

1.  **Para la Fase 12-14 (Analytics Pesados):**
    *   Cuando calcules proyecciones complejas, el servidor de Render trabajará duro. Si el frontend estuviera en el mismo servidor, la interfaz se pondría lenta. Al separarlos, la UI sigue volando en Vercel aunque el backend esté pensando.

2.  **Para la Fase 15 (IA):**
    *   Cuando le pidas a la IA "Analiza mi semana", la petición tardará ~30 segundos.
    *   Vercel (en plan gratis) cortaría la conexión a los 10s (Timeout).
    *   Render mantendrá la conexión abierta hasta que la IA termine, sin errores.

---

### Resumen de Costos Iniciales
*   **Vercel:** $0 (Hobby Tier)
*   **Render:** $0 (Free Tier) -> $7/mes cuando quieras evitar que el servidor "duerma".
*   **Neon:** $0 (Free Tier)

Esta estructura es profesional, escalable y lista para lo que viene.
