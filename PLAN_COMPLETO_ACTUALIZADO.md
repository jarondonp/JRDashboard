# 🎯 PLAN COMPLETO DE MIGRACIÓN - DASHBOARD MENTAL HEALTH TRACKER

**Proyecto:** Migración completa de React App a PostgreSQL (Neon) con REST API  
**Stack:** React + Vite + TanStack Query + Express + Drizzle ORM + PostgreSQL  
**Branch:** feature/api-store-migration  
**Fecha:** Noviembre 2025

---

## 📊 RESUMEN EJECUTIVO

| Fase | Componente | Estado | Progreso |
|------|------------|--------|----------|
| ✅ Fase 1 | Backend CRUD Completo | Completado | 100% |
| ✅ Fase 2 | Frontend Services & Hooks | Completado | 100% |
| ✅ Fase 3 | Dashboard Maestro | Completado | 100% |
| ✅ Fase 4 | GoalsPage CRUD | Completado | 100% |
| ✅ Fase 5 | TasksPage CRUD | Completado | 100% |
| ✅ Fase 6 | ProgressPage CRUD | Completado | 100% |
| ✅ Fase 7 | DocumentsPage CRUD | Completado | 100% |
| ✅ Fase 8 | ReportsPage - Analytics Fase 1 | Completado | 100% |
| 🎨 Fase 9 | UI/UX Professional Redesign | **PENDIENTE** | 0% |
| ⏳ Fase 10 | Paneles Especializados por Área | Pendiente | 0% |
| ⏳ Fase 11 | Vistas Avanzadas y Filtros | Pendiente | 0% |
| ⏳ Fase 12 | ReportsPage - Analytics Fase 2 | Pendiente | 0% |
| ⏳ Fase 13 | ReportsPage - Analytics Fase 3 | Pendiente | 0% |
| ⏳ Fase 14 | ReportsPage - Analytics Fase 4 | Pendiente | 0% |
| ⏳ Fase 15 | Preparación para IA (Futura) | Pendiente | 0% |
| ⏳ Fase 16 | Validación & Testing | Pendiente | 0% |
| ⏳ Fase 17 | Optimización Final | Pendiente | 0% |

**🎯 Progreso Global: 47% (8/17 fases completadas)**

---

## ✅ FASES COMPLETADAS (1-8)

### **✅ FASE 1: Backend CRUD Completo** (100%)

**Componentes Implementados:**
- ✅ `server/storage.ts` - Métodos CRUD para todas las entidades
  - `getAreas()`, `createArea()`, `updateArea()`, `deleteArea()`
  - `getGoals()`, `createGoal()`, `updateGoal()`, `deleteGoal()`
  - `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`
  - `getProgressLogs()`, `createProgressLog()`, `updateProgressLog()`, `deleteProgressLog()`
  - `getDocuments()`, `createDocument()`, `updateDocument()`, `deleteDocument()`
  - `getReports()`, `createReport()`, `updateReport()`, `deleteReport()`

- ✅ `server/routes.ts` - Endpoints REST con validación Zod
  - `/api/areas` - GET, POST, PUT, DELETE
  - `/api/goals` - GET, POST, PUT, DELETE
  - `/api/tasks` - GET, POST, PUT, DELETE
  - `/api/progress` - GET, POST, PUT, DELETE
  - `/api/documents` - GET, POST, PUT, DELETE
  - `/api/reports` - GET, POST, PUT, DELETE

- ✅ `server/progressCalculator.ts` - Sistema automático de cálculo
  - `calculateGoalProgress()` - Promedio de tareas
  - `updateGoalProgress()` - Actualiza `computed_progress`
  - `updateTaskProgressByStatus()` - Auto-asigna progreso según estado

- ✅ `shared/schema.ts` - Schema Drizzle ORM completo
  - Campos especiales: `computed_progress`, `progress_percentage`, `mood`, `impact_level`

**Resultado:** Backend 100% funcional con base de datos PostgreSQL en Neon

---

### **✅ FASE 2: Frontend Services & Hooks** (100%)

**Componentes Implementados:**
- ✅ `client/src/services/apiClient.ts` - Helper genérico HTTP
- ✅ `client/src/services/areasApi.ts` - CRUD de áreas
- ✅ `client/src/services/goalsApi.ts` - CRUD de metas
- ✅ `client/src/services/tasksApi.ts` - CRUD de tareas
- ✅ `client/src/services/progressApi.ts` - CRUD de avances
- ✅ `client/src/services/documentsApi.ts` - CRUD de documentos
- ✅ `client/src/services/reportsApi.ts` - CRUD de reportes

- ✅ `client/src/hooks/useAreas.ts` - Hooks con TanStack Query
- ✅ `client/src/hooks/useGoals.ts` - useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal
- ✅ `client/src/hooks/useTasks.ts` - Hooks de tareas
- ✅ `client/src/hooks/useProgress.ts` - Hooks de progreso
- ✅ `client/src/hooks/useDocuments.ts` - Hooks de documentos
- ✅ `client/src/hooks/useReports.ts` - Hooks de reportes + analytics
- ✅ `client/src/hooks/useStats.ts` - Hooks para estadísticas del dashboard

**Resultado:** Capa de servicios completa con invalidación automática de queries

---

### **✅ FASE 3: Dashboard Maestro** (100%)

**Componentes Implementados:**
- ✅ `client/src/pages/DashboardPage.tsx` - Dashboard principal
  - 4 secciones: Resumen Mensual, Progreso Reciente, Documentos Críticos, Tareas Abiertas
  - Cálculo correcto de completación global (promedio de todas las metas)
  - Integración con 6 hooks diferentes

- ✅ Componentes base:
  - `MetricCard.tsx` - Tarjetas de métricas
  - `ProgressCard.tsx` - Tarjetas de progreso con barra
  - `ListCard.tsx` - Tarjetas de listas
  - `KPICard.tsx` - Tarjetas de KPIs con tendencias

**Resultado:** Dashboard funcional con métricas en tiempo real

---

### **✅ FASE 4: GoalsPage CRUD** (100%)

**Componentes Implementados:**
- ✅ Modal de crear/editar con formulario completo
- ✅ Dropdown de áreas relacionadas
- ✅ Campos: título, descripción, área, fechas, prioridad, estado
- ✅ Barra de progreso usando `computed_progress` (calculado automáticamente)
- ✅ Badges de prioridad y estado con colores
- ✅ Eliminación con confirmación

**Resultado:** CRUD completo de metas con progress automático

---

### **✅ FASE 5: TasksPage CRUD** (100%)

**Componentes Implementados:**
- ✅ Selector de área con filtrado de metas relacionadas
- ✅ Campo `progress_percentage` editable manualmente
- ✅ Sistema de tags con gestión dinámica
- ✅ Actualización automática del progreso de la meta al guardar
- ✅ Invalidación en cascada: tasks → goals → monthly-stats

**Bugs Resueltos:**
- ✅ Progreso no se guardaba (fix: selección explícita de campos en Drizzle)
- ✅ Dashboard mostraba 0% (fix: cálculo global en lugar de mensual)

**Resultado:** CRUD completo de tareas con cálculo automático de progreso

---

### **✅ FASE 6: ProgressPage CRUD** (100%)

**Componentes Implementados:**
- ✅ Formulario de registro de avances diarios/semanales
- ✅ Campo `mood` (1-5) con emojis: 😞😕😐🙂😄
- ✅ Campo `impact_level` (1-5) con estrellas
- ✅ Selector de área y meta relacionada
- ✅ Campo de fecha y descripción del avance

**Resultado:** Sistema de tracking de progreso y bienestar completado

---

### **✅ FASE 7: DocumentsPage CRUD** (100%)

**Componentes Implementados:**
- ✅ 8 tipos de documentos:
  - Contrato, Certificado, Identificación, Recibo, Factura, Póliza, Escritura, Otro
- ✅ Campo `review_date` con alerta de 7 días
- ✅ Campo URL para enlaces externos
- ✅ Relacionar con áreas y metas opcionales
- ✅ Badges de tipo de documento con colores

**Resultado:** Gestión completa de documentos con alertas de revisión

---

### **✅ FASE 8: ReportsPage - Analytics Fase 1** (100%)

**Categoría 1: Rendimiento y Productividad** (3/3 reportes completados)

#### **1. ✅ Reporte Ejecutivo Mensual** 📊
- ✅ 6 KPI Cards:
  - Tasa de Cumplimiento (%)
  - Metas Completadas (n/total)
  - Tareas Completadas (n/total)
  - Horas Estimadas (total)
  - Mood Promedio (1-5)
  - Avances del Mes (count)
- ✅ LineChart: Progreso Diario (últimos 30 días) - Avances + Mood
- ✅ BarChart: Cumplimiento por Área (%)
- ✅ Top 5 Logros con estrellas de impacto 🥇🥈🥉

#### **2. ✅ Análisis por Área** 🎯
- ✅ RadarChart: Balance de Vida (progreso en cada área)
- ✅ BarChart Stacked: Tareas por Estado (completadas, en progreso, pendientes)
- ✅ Recomendaciones automáticas para áreas <50% progreso
- ✅ Lista de insights personalizados

#### **3. ✅ Tendencias de Mood y Bienestar** 💚
- ✅ KPI Cards: Mood Promedio, Mejor Día, Total Registros
- ✅ LineChart Dual: Mood vs Productividad (correlación)
- ✅ BarChart: Mood Semanal (últimas 4 semanas)
- ✅ Insights automáticos basados en patrones

**Infraestructura:**
- ✅ Chart Components Reusables:
  - `BarChart.tsx`, `LineChart.tsx`, `RadarChart.tsx`
- ✅ Hooks de Analytics:
  - `useMonthlyExecutiveReport()`
  - `useAreaProductivityReport()`
  - `useMoodTrendsReport()`
- ✅ Navegación por tabs en ReportsPage

**Resultado:** 3/12 reportes estratégicos completados (25% del total de analytics)
  - `useAreaProductivityReport()`
  - `useMoodTrendsReport()`
- ✅ Navegación por tabs en ReportsPage

**Resultado:** 3 reportes estratégicos de alto valor implementados con Recharts

---

## 🎨 FASE 9: UI/UX PROFESSIONAL REDESIGN (PRÓXIMA - 0%)

**Objetivo:** Transformar la aplicación con un diseño profesional de clase mundial

### **9.1 Sistema de Diseño Completo**

**Design Tokens:**
```typescript
// Paleta de colores profesional
const colors = {
  primary: { 50-900 },    // Indigo/Purple moderno
  secondary: { 50-900 },  // Teal/Cyan complementario
  success: { 50-900 },    // Green vibrante
  warning: { 50-900 },    // Amber/Orange
  danger: { 50-900 },     // Red elegante
  neutral: { 50-900 }     // Gray scale optimizado
}

// Tipografía escalable
const typography = {
  fontFamily: 'Inter, system-ui',
  scale: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl }
}

// Spacing consistente (4px base)
const spacing = { 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64 }

// Sombras y elevaciones
const shadows = {
  sm: 'subtle card shadow',
  md: 'standard elevation',
  lg: 'prominent modal shadow',
  xl: 'dramatic overlay shadow'
}

// Radios de borde
const borderRadius = { sm: 8px, md: 12px, lg: 16px, xl: 24px }
```

**Archivos a Crear:**
- [ ] `client/src/design-system/tokens.ts` - Design tokens
- [ ] `client/src/design-system/theme.ts` - Tema global
- [ ] Actualizar `tailwind.config.js` con tokens personalizados

---

### **9.2 Componentes UI Renovados**

**Buttons:**
- [ ] Refactorizar con variantes: primary, secondary, outline, ghost, danger
- [ ] Estados: default, hover, active, disabled, loading
- [ ] Tamaños: sm, md, lg, xl
- [ ] Agregar iconos y loading spinners

**Cards:**
- [ ] Rediseñar con gradientes sutiles de fondo
- [ ] Hover effects con elevación
- [ ] Border glow sutil en interacción
- [ ] Skeleton loading states

**Forms:**
- [ ] Inputs con focus ring animado
- [ ] Labels flotantes (floating labels)
- [ ] Validación visual en tiempo real
- [ ] Error messages elegantes
- [ ] Select customizado con búsqueda

**Modals:**
- [ ] Backdrop blur + overlay gradient
- [ ] Animación de entrada suave (scale + fade)
- [ ] Header con gradiente
- [ ] Footer con acciones destacadas

**Navigation:**
- [ ] Sidebar con iconos Lucide/Heroicons
- [ ] Active state con barra lateral coloreada
- [ ] Hover con background sutil
- [ ] Collapse/expand animado
- [ ] Breadcrumbs en header

**Archivos a Refactorizar:**
- [ ] `MetricCard.tsx` → Gradientes, iconos, animaciones
- [ ] `ProgressCard.tsx` → Barra de progreso animada
- [ ] `ListCard.tsx` → Hover states, iconos
- [ ] `KPICard.tsx` → Trend arrows animados
- [ ] Todos los modales de CRUD

---

### **9.3 Animaciones y Micro-interacciones**

**Librería:** Framer Motion o CSS Animations

**Implementar:**
- [ ] Page transitions (fade + slide)
- [ ] Card hover lift effect
- [ ] Button press animation
- [ ] Loading states (skeleton, spinner, pulse)
- [ ] Success/error notifications con toast
- [ ] Number counters animados (KPIs)
- [ ] Chart animations (Recharts built-in)
- [ ] Modal open/close transitions
- [ ] List item stagger animations

**Archivos a Crear:**
- [ ] `client/src/components/animations/` - Wrappers de animación
- [ ] `client/src/components/Toast.tsx` - Sistema de notificaciones

---

### **9.4 Layout y Estructura**

**App Layout:**
- [ ] Sidebar fijo colapsable
- [ ] Header con breadcrumbs y user menu
- [ ] Main content con max-width optimizado
- [ ] Footer opcional con info

**Responsive Design:**
- [ ] Mobile-first approach
- [ ] Breakpoints: sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- [ ] Sidebar → Drawer en mobile
- [ ] Grid responsivo en dashboards
- [ ] Stack vertical en móvil

**Archivos a Refactorizar:**
- [ ] `client/src/App.tsx` - Nuevo layout wrapper
- [ ] Todas las páginas para usar layout consistente

---

### **9.5 Dashboard Refinado**

**Mejoras Visuales:**
- [ ] Hero section con gradiente de fondo
- [ ] Cards con glass-morphism effect
- [ ] Iconos de Lucide/Heroicons en métricas
- [ ] Gráficos con colores armoniosos
- [ ] Widgets interactivos (hover para más detalles)
- [ ] Empty states ilustrados (sin datos)
- [ ] Loading skeletons mientras carga

**Archivos a Actualizar:**
- [ ] `DashboardPage.tsx` - Nuevo diseño
- [ ] Todos los componentes de cards

---

### **9.6 Páginas CRUD Mejoradas**

**Lista de Items:**
- [ ] Tabla con hover row highlight
- [ ] Alternating row colors
- [ ] Sticky header
- [ ] Sort indicators
- [ ] Paginación elegante

**Formularios:**
- [ ] Layout de 2 columnas en desktop
- [ ] Grupos de campos con secciones
- [ ] Helpers text bajo inputs
- [ ] Character counters
- [ ] Preview en tiempo real

**Archivos a Actualizar:**
- [ ] `GoalsPage.tsx`, `TasksPage.tsx`, `ProgressPage.tsx`
- [ ] `DocumentsPage.tsx`, `AreasPage.tsx`

---

### **9.7 ReportsPage Mejorado**

**Mejoras:**
- [ ] Tabs con indicador animado
- [ ] Header con filtros de fecha elegantes
- [ ] Export button destacado
- [ ] Print-friendly styles
- [ ] Charts con tooltips mejorados
- [ ] Color schemes consistentes

**Archivos a Actualizar:**
- [ ] `ReportsPage.tsx` - Rediseño completo

---

### **9.8 Checklist de Calidad UI/UX**

**Visual:**
- [ ] Paleta de colores consistente en toda la app
- [ ] Tipografía escalable y legible
- [ ] Espaciado consistente (8px grid)
- [ ] Contraste WCAG AA (accesibilidad)
- [ ] Iconos consistentes (misma librería)

**Interacción:**
- [ ] Feedback visual en todas las acciones
- [ ] Loading states en operaciones async
- [ ] Error handling amigable
- [ ] Success confirmations
- [ ] Hover states en elementos clickeables

**Performance:**
- [ ] Lazy loading de componentes pesados
- [ ] Optimización de re-renders
- [ ] Imágenes optimizadas
- [ ] CSS minificado

**Accesibilidad:**
- [ ] Keyboard navigation
- [ ] Focus visible
- [ ] ARIA labels
- [ ] Semantic HTML

---

## ⏳ FASE 10: Paneles Especializados por Área (Pendiente - 0%)

**Objetivo:** Crear vistas dedicadas por cada área de vida con información contextual

### **10.1 Componente Base AreaPanel**
- [ ] Crear `<AreaPanel />` reutilizable
- [ ] Props: areaId, areaName, color, icon
- [ ] Secciones:
  - Header con nombre del área y color característico
  - KPIs del área (progreso, tareas, documentos)
  - Metas activas del área
  - Tareas pendientes/en progreso
  - Avances recientes registrados
  - Documentos relacionados
  - Gráfico de tendencia mensual

### **10.2 Paneles Específicos**
- [ ] **Panel Emocional** (`/panel/emotional`)
  - Mood tracking con gráfico de tendencia
  - Registros de salud mental y bienestar
  - Actividades de autocuidado
  - Estadísticas de mood promedio
  
- [ ] **Panel Vocacional** (`/panel/vocational`)
  - Proyectos profesionales (ej: SLS)
  - Metas de carrera y desarrollo
  - Certificaciones y formación
  - Horas invertidas en aprendizaje

- [ ] **Panel Financiero** (`/panel/financial`)
  - Ingresos y gastos (si se trackean)
  - Metas de ahorro y presupuesto
  - Documentos financieros importantes
  - Proyección de cumplimiento financiero

- [ ] **Panel Migración** (`/panel/migration`)
  - Documentos de visa y proceso
  - Tareas de trámites
  - Timeline del proceso
  - Checklist de requisitos

- [ ] **Panel Becas** (`/panel/scholarships`)
  - Aplicaciones en proceso
  - Deadlines próximos
  - Documentos requeridos
  - Estado de cada aplicación

- [ ] **Panel Comercial** (`/panel/commercial`)
  - Clientes activos
  - Pipeline de proyectos
  - Tareas de seguimiento
  - Ingresos proyectados

### **10.3 Routing y Navegación**
- [ ] Agregar rutas `/panel/:areaSlug` en App.tsx
- [ ] Crear sección "🎨 PANELES" en sidebar
- [ ] Generar links dinámicos según áreas en BD
- [ ] Breadcrumbs: Dashboard > Paneles > [Área]

**Componentes a Crear:**
- [ ] `client/src/components/AreaPanel.tsx`
- [ ] `client/src/pages/PanelPage.tsx`
- [ ] Hook: `useAreaPanel(areaId)` para datos agregados

---

## ⏳ FASE 11: Vistas Avanzadas y Filtros (Pendiente - 0%)

**Objetivo:** Vistas especializadas para casos de uso específicos

### **11.1 Timeline General**
- [ ] Crear `TimelinePage.tsx` (`/timeline`)
- [ ] Vista cronológica unificada combinando:
  - Avances registrados (progress_logs)
  - Tareas completadas
  - Documentos añadidos
  - Metas alcanzadas
- [ ] Agrupación por día/semana/mes (selector)
- [ ] Scroll infinito con paginación
- [ ] Filtros por área y tipo de evento

### **11.2 Vistas Especializadas**

**Tareas Atrasadas:**
- [ ] Crear `OverdueTasksPage.tsx` (`/tasks/overdue`)
- [ ] Filtro: `due_date < hoy AND status != completada`
- [ ] Ordenar por días de retraso
- [ ] Acción rápida: reprogramar o completar
- [ ] Badge de urgencia (rojo si >7 días)

**Metas por Área:**
- [ ] Crear `GoalsByAreaPage.tsx` (`/goals/by-area`)
- [ ] Agrupación visual por área con totales
- [ ] Progress bar por área
- [ ] Expandir/colapsar cada grupo
- [ ] Gráfico de distribución

**Documentos en Revisión:**
- [ ] Crear `DocumentsReviewPage.tsx` (`/documents/review`)
- [ ] Filtro: `review_date <= hoy + 7 días`
- [ ] Alertas por prioridad (rojo, amarillo, verde)
- [ ] Acción rápida: marcar como revisado

**Panel de Cumplimiento:**
- [ ] Crear `ComplianceDashboard.tsx` (`/analytics/compliance`)
- [ ] Gráficas de % cumplimiento por área (bar chart)
- [ ] Tendencias mensuales (line chart)
- [ ] Comparativa con mes anterior
- [ ] Áreas con mejor/peor rendimiento

### **11.3 Búsqueda Global**
- [ ] Implementar `<GlobalSearch />` en header
- [ ] Búsqueda cross-entity:
  - Metas (por título, descripción)
  - Tareas (por título, tags)
  - Documentos (por título, tipo)
  - Áreas (por nombre)
- [ ] Resultados agrupados por tipo
- [ ] Navegación directa al resultado
- [ ] Atajos de teclado: `Ctrl+K` o `Cmd+K`

**Componentes a Crear:**
- [ ] `TimelinePage.tsx`
- [ ] `OverdueTasksPage.tsx`
- [ ] `GoalsByAreaPage.tsx`
- [ ] `DocumentsReviewPage.tsx`
- [ ] `ComplianceDashboard.tsx`
- [ ] `GlobalSearch.tsx`
- [ ] Hook: `useGlobalSearch(query)`

---

## ⏳ FASE 12: ReportsPage - Analytics Fase 2 (Pendiente - 0%)

**Categoría 2: Planificación y Proyección** (0/3 reportes completados)

### **12.1 ⏳ Forecast de Cumplimiento** 📈
**Objetivo:** Predecir el cumplimiento de metas basado en tendencias actuales

**Métricas a Calcular:**
- [ ] Velocidad actual de completación (tareas/semana)
- [ ] Días laborables restantes en el mes
- [ ] Predicción de metas a completar (regresión lineal)
- [ ] Probabilidad de éxito por meta (baja/media/alta)
- [ ] Brecha entre objetivo y proyección

**Visualizaciones:**
- [ ] LineChart: Progreso Real vs Proyectado
- [ ] BarChart: Metas en Riesgo por Área
- [ ] KPI Cards: % Cumplimiento Proyectado, Días Críticos Restantes
- [ ] Tabla: Lista de metas con estado de forecast

**Algoritmo:**
```typescript
// Tendencia lineal: y = mx + b
const calcularTendencia = (progresoPasado: number[]) => {
  // Regresión lineal simple
  const prediccion = extrapolate(progresoPasado, diasRestantes);
  return prediccion >= 100 ? 'alta' : prediccion >= 70 ? 'media' : 'baja';
}
```

**Recomendaciones Automáticas:**
- [ ] "Acelera 20% para cumplir Meta X"
- [ ] "Reasigna 3 tareas de Área Y a Área Z"
- [ ] "Meta A está en riesgo - considera reprogramar"

---

### **12.2 ⏳ Análisis de Carga de Trabajo** ⚖️
**Objetivo:** Evaluar capacidad vs demanda para evitar sobrecarga

**Métricas a Calcular:**
- [ ] Horas disponibles por semana (configurable, ej: 40h)
- [ ] Horas comprometidas (suma de `estimated_effort` de tareas pendientes)
- [ ] Porcentaje de utilización (comprometido/disponible)
- [ ] Semanas sobrecargadas (>100% utilización)
- [ ] Distribución de carga por área

**Visualizaciones:**
- [ ] BarChart: Horas por Semana (disponible vs comprometido)
- [ ] LineChart: Tendencia de Carga (últimas 8 semanas)
- [ ] PieChart: Distribución de Horas por Área
- [ ] Heatmap: Días de la semana con más carga
- [ ] KPI Cards: Utilización %, Semanas Críticas, Horas Libres

**Detección de Problemas:**
- [ ] Alerta roja si utilización > 120%
- [ ] Alerta amarilla si utilización > 90%
- [ ] Sugerencias de redistribución de tareas

**Recomendaciones:**
- [ ] "Semana del 20-Nov: 150% de capacidad - pospón 5 tareas"
- [ ] "Área Vocacional consume 60% de tu tiempo - considera delegar"

---

### **12.3 ⏳ Matriz de Prioridades y Urgencias** (Eisenhower) 📊
**Objetivo:** Clasificar tareas según urgencia e importancia

**Clasificación Automática:**
```typescript
const clasificarTarea = (tarea: Task) => {
  const urgente = tarea.due_date && daysDiff(tarea.due_date, hoy) <= 3;
  const importante = tarea.priority === 'alta';
  
  if (urgente && importante) return 'cuadrante-1'; // Hacer YA
  if (!urgente && importante) return 'cuadrante-2'; // Planificar
  if (urgente && !importante) return 'cuadrante-3'; // Delegar
  return 'cuadrante-4'; // Eliminar/Posponer
}
```

**Visualizaciones:**
- [ ] Matriz 2x2 con 4 cuadrantes:
  - **Q1 (Urgente + Importante):** Crisis, Deadlines críticos
  - **Q2 (No Urgente + Importante):** Planificación, Desarrollo
  - **Q3 (Urgente + No Importante):** Interrupciones, Delegar
  - **Q4 (Ni Urgente Ni Importante):** Distracciones, Eliminar
- [ ] Heatmap de Urgencia por Área
- [ ] Lista de "Acciones Inmediatas" (Q1)
- [ ] Lista de "Tareas a Delegar" (Q3)

**Métricas:**
- [ ] % de tareas en cada cuadrante
- [ ] Tiempo promedio en Q1 (indicador de crisis)
- [ ] Tendencia: ¿estás en modo reactivo o proactivo?

**Recomendaciones:**
- [ ] "70% de tareas en Q1 - reduce el modo crisis"
- [ ] "Invierte más tiempo en Q2 para prevenir urgencias"
- [ ] "Considera eliminar tareas en Q4"

**Componentes a Crear:**
- [ ] `ForecastReport.tsx` - Predicción de cumplimiento
- [ ] `WorkloadReport.tsx` - Análisis de capacidad
- [ ] `PriorityMatrixReport.tsx` - Matriz Eisenhower
- [ ] Hook: `useForecastAnalytics()` - Cálculos de predicción
- [ ] Hook: `useWorkloadAnalytics()` - Cálculos de carga
- [ ] Hook: `usePriorityMatrix()` - Clasificación de tareas
- [ ] Actualizar `ReportsPage.tsx` con 3 tabs nuevos en Categoría 2

---

## ⏳ FASE 13: ReportsPage - Analytics Fase 3 (Pendiente - 0%)

**Categoría 3: Análisis Profundo** (0/3 reportes completados)

### **13.1 ⏳ Reporte de Patrones y Hábitos** 🔍
**Objetivo:** Identificar patrones de productividad y comportamiento

**Análisis a Realizar:**
- [ ] **Mejores Horarios de Productividad**
  - Agrupar tareas completadas por hora del día (si hay timestamps)
  - Identificar franjas de máxima productividad
  - Correlación hora vs tipo de tarea
  
- [ ] **Tags Más Frecuentes**
  - Top 10 tags más usados
  - Tags asociados a mayor progreso
  - Tags asociados a procrastinación (tareas atrasadas)
  
- [ ] **Áreas Más Activas por Día de Semana**
  - Heatmap: Día × Área con conteo de tareas completadas
  - Identificar patrones (ej: Lunes = Vocacional, Viernes = Personal)
  
- [ ] **Correlación Día de la Semana vs Mood**
  - ¿Qué días tienes mejor/peor mood?
  - Promedio de mood por día de la semana
  
- [ ] **Patrones de Procrastinación**
  - Tareas que se posponen múltiples veces
  - Áreas con más tareas atrasadas
  - Tiempo promedio de retraso

**Visualizaciones:**
- [ ] Heatmap: Día × Hora (productividad)
- [ ] BarChart: Tags más usados (frecuencia)
- [ ] Heatmap: Día × Área (actividad)
- [ ] LineChart: Mood por día de la semana
- [ ] Tabla: Tareas procrastinadas (título, retraso, área)

**Insights Automáticos:**
- [ ] "Eres más productivo los Martes entre 9-11am"
- [ ] "El tag #planificación está en 40% de tus metas exitosas"
- [ ] "Los Viernes tu mood baja 15% - considera actividades de bienestar"

---

### **13.2 ⏳ Análisis de ROI por Área** 💰
**Objetivo:** Medir retorno de inversión de esfuerzo en cada área

**Métricas a Calcular:**
```typescript
const calcularROI = (area: Area) => {
  const esfuerzoInvertido = sumHorasEstimadas(area);
  const progresoLogrado = avgProgresoMetas(area);
  const roi = (progresoLogrado / esfuerzoInvertido) * 100;
  return roi; // Progreso por hora invertida
}
```

**Análisis:**
- [ ] Esfuerzo invertido (horas) por área
- [ ] Progreso logrado (%) por área
- [ ] ROI = Progreso / Esfuerzo
- [ ] Áreas con mejor retorno (alta eficiencia)
- [ ] Áreas que requieren más recursos (baja eficiencia)
- [ ] Tendencia de ROI en últimos 3 meses

**Visualizaciones:**
- [ ] ScatterPlot: Esfuerzo (X) vs Progreso (Y) por área
  - Cuadrante superior izquierdo = Alto ROI (poco esfuerzo, mucho progreso)
  - Cuadrante inferior derecho = Bajo ROI (mucho esfuerzo, poco progreso)
- [ ] BarChart: ROI por Área (ordenado de mayor a menor)
- [ ] LineChart: Evolución de ROI en últimos meses
- [ ] KPI Cards: Área con mejor ROI, Área que necesita atención

**Recomendaciones:**
- [ ] "Área Emocional tiene ROI de 180% - continúa invirtiendo aquí"
- [ ] "Área Comercial tiene ROI de 35% - optimiza procesos o reduce esfuerzo"
- [ ] "Considera redistribuir 5 horas de Área X a Área Y"

---

### **13.3 ⏳ Ciclo de Vida de Metas** 🔄
**Objetivo:** Analizar el ciclo completo desde creación hasta completación

**Fases del Ciclo:**
```typescript
enum FaseMeta {
  Inicio = 'primeros 7 días',
  Desarrollo = 'días 8-30',
  Aceleración = 'últimos 7 días antes de deadline',
  Completada = 'meta alcanzada',
  Abandonada = 'sin actividad >30 días'
}
```

**Análisis a Realizar:**
- [ ] **Tiempo Promedio de Completación**
  - Por prioridad (alta/media/baja)
  - Por área
  - Por tipo de meta (si hay categorías)
  
- [ ] **Fases del Ciclo**
  - Tiempo en cada fase
  - Metas que se estancan (sin progreso por >15 días)
  - Metas que aceleran al final (efecto deadline)
  
- [ ] **Tasa de Éxito**
  - Metas completadas vs abandonadas
  - Por prioridad
  - Por área
  
- [ ] **Factores de Éxito**
  - Correlación: metas con >5 tareas = mayor éxito
  - Metas con deadlines claros vs sin deadline
  - Metas con mood alto vs bajo

**Visualizaciones:**
- [ ] Sankey Diagram: Flujo de metas (Creadas → En Progreso → Completadas/Abandonadas)
- [ ] BarChart: Tiempo promedio de completación por área
- [ ] LineChart: Progreso acumulado en ciclo de vida típico (día 1-30)
- [ ] PieChart: Tasa de éxito (completadas vs abandonadas)
- [ ] Tabla: Metas estancadas (sin progreso en X días)

**Métricas Clave:**
- [ ] Tiempo promedio hasta primera tarea creada
- [ ] Tiempo promedio hasta 50% de progreso
- [ ] Tiempo promedio hasta completación
- [ ] % de metas que se abandonan
- [ ] % de metas que cumplen deadline

**Insights:**
- [ ] "Metas de prioridad alta se completan 40% más rápido"
- [ ] "Tienes 3 metas estancadas hace >20 días - considera revisarlas"
- [ ] "Tasa de éxito en Área Vocacional: 85% - ¡excelente!"

**Componentes a Crear:**
- [ ] `PatternsReport.tsx` - Análisis de patrones y hábitos
- [ ] `ROIReport.tsx` - Retorno de inversión por área
- [ ] `GoalLifecycleReport.tsx` - Ciclo de vida de metas
- [ ] Hook: `usePatternsAnalytics()` - Cálculos de patrones
- [ ] Hook: `useROIAnalytics()` - Cálculos de ROI
- [ ] Hook: `useGoalLifecycleAnalytics()` - Análisis de ciclo de vida
- [ ] Actualizar `ReportsPage.tsx` con 3 tabs nuevos en Categoría 3

---

## ⏳ FASE 14: ReportsPage - Analytics Fase 4 (Pendiente - 0%)

**Categoría 4: Comparativos e Históricos** (0/3 reportes completados)

### **14.1 ⏳ Comparativa Trimestral** 📅
**Objetivo:** Analizar evolución a lo largo del año

**Análisis por Trimestre:**
```typescript
const trimestres = {
  Q1: { meses: [0, 1, 2], label: 'Ene-Mar' },    // Enero-Marzo
  Q2: { meses: [3, 4, 5], label: 'Abr-Jun' },    // Abril-Junio
  Q3: { meses: [6, 7, 8], label: 'Jul-Sep' },    // Julio-Septiembre
  Q4: { meses: [9, 10, 11], label: 'Oct-Dic' }   // Octubre-Diciembre
}
```

**Métricas a Comparar:**
- [ ] Metas completadas por trimestre
- [ ] Tareas completadas por trimestre
- [ ] Horas invertidas por trimestre
- [ ] Mood promedio por trimestre
- [ ] Áreas más activas por trimestre
- [ ] Progreso promedio por trimestre

**Visualizaciones:**
- [ ] LineChart: Tendencia Anual (4 puntos: Q1, Q2, Q3, Q4)
  - Líneas múltiples: Metas, Tareas, Mood
- [ ] BarChart Grouped: Comparación Q1 vs Q2 vs Q3 vs Q4
- [ ] Heatmap: Trimestre × Área (actividad)
- [ ] KPI Cards: Mejor Trimestre, Peor Trimestre, Tendencia

**Análisis Año vs Año (si hay datos de años anteriores):**
- [ ] Comparar 2024 vs 2025 (mismo trimestre)
- [ ] Crecimiento anual (%)
- [ ] Áreas de mejora año a año

**Proyección Fin de Año:**
```typescript
const proyectarQ4 = () => {
  const promedioQ1Q2Q3 = (q1 + q2 + q3) / 3;
  const proyeccionQ4 = promedioQ1Q2Q3 * 1.05; // Asumiendo 5% de mejora
  return proyeccionQ4;
}
```

**Insights:**
- [ ] "Q2 fue tu trimestre más productivo con 45 tareas completadas"
- [ ] "Tendencia ascendente: +15% de progreso Q1 → Q3"
- [ ] "Proyección Q4: completarás 12 metas si mantienes el ritmo"

---

### **14.2 ⏳ Streaks y Consistencia** 🔥
**Objetivo:** Medir consistencia y rachas de actividad

**Calendario de Contribuciones (estilo GitHub):**
```typescript
// Matriz de 52 semanas × 7 días = 364 celdas
const contributionCalendar = Array(52).fill(null).map((_, semana) => 
  Array(7).fill(null).map((_, dia) => {
    const fecha = calcularFecha(semana, dia);
    const actividad = contarActividadEnFecha(fecha); // 0-4+ eventos
    return { fecha, actividad, color: getColorByActivity(actividad) };
  })
);
```

**Niveles de Actividad:**
- [ ] 0 eventos = gris (sin actividad)
- [ ] 1 evento = verde claro
- [ ] 2-3 eventos = verde medio
- [ ] 4+ eventos = verde oscuro

**Métricas de Consistencia:**
- [ ] **Racha Actual**
  - Días consecutivos con al menos 1 actividad
  - Tipo de actividad: tarea completada, avance registrado, meta creada
  
- [ ] **Mejor Racha Histórica**
  - Máximo de días consecutivos
  - Fecha de inicio y fin de la mejor racha
  
- [ ] **Días Activos Totales**
  - Total de días con al menos 1 actividad
  - Porcentaje del año (ej: 180/365 = 49%)
  
- [ ] **Promedio de Actividades por Día Activo**
  - Total actividades / días activos
  
- [ ] **Días sin Actividad**
  - Días con 0 eventos
  - Períodos más largos sin actividad

**Visualizaciones:**
- [ ] Heatmap Calendar: 52×7 grid con colores por intensidad
- [ ] LineChart: Racha diaria (último año)
- [ ] KPI Cards:
  - 🔥 Racha Actual: "15 días"
  - 🏆 Mejor Racha: "42 días (Feb-Mar)"
  - 📊 Días Activos: "210/365 (58%)"
  - ⚡ Promedio Diario: "3.5 actividades"

**Metas de Consistencia:**
- [ ] "Alcanza 30 días de racha para desbloquear insignia 🏅"
- [ ] "Completa 250 días activos este año (faltan 40)"
- [ ] "Tu mejor racha fue de 42 días - ¡intenta superarla!"

**Insights:**
- [ ] "Llevas 15 días consecutivos - ¡no rompas la racha!"
- [ ] "Tuviste un periodo inactivo de 7 días en Agosto - ¿vacaciones?"
- [ ] "Los Martes son tu día más productivo (promedio 5.2 actividades)"

---

### **14.3 ⏳ Insights y Recomendaciones con IA** 🤖
**Objetivo:** Generar insights automáticos basados en patrones

**Algoritmos de Análisis:**

#### **1. Detección de Anomalías**
```typescript
const detectarAnomalias = () => {
  const promedioSemanal = calcularPromedioTareas();
  const semanasRecientes = obtenerUltimas4Semanas();
  
  semanasRecientes.forEach(semana => {
    if (semana.tareas < promedioSemanal * 0.5) {
      alertas.push(`Semana del ${semana.fecha}: 50% menos productiva`);
    }
  });
}
```

#### **2. Predicción de Riesgo de Burnout**
```typescript
const calcularRiesgoBurnout = () => {
  const factores = {
    sobrecarga: cargaTrabajo > 120,
    moodBajo: moodPromedio < 2.5,
    rachaIntensa: diasConsecutivos > 30 && actividadesDiarias > 6,
    sinDescanso: diasSinActividad === 0 // Nunca descansa
  };
  
  const riesgo = Object.values(factores).filter(Boolean).length;
  return riesgo >= 3 ? 'alto' : riesgo === 2 ? 'medio' : 'bajo';
}
```

#### **3. Sugerencias Personalizadas**
```typescript
const generarSugerencias = () => {
  const sugerencias = [];
  
  // Basado en patrones históricos
  if (mejorDiaSemana === 'Martes') {
    sugerencias.push("Agenda tareas difíciles los Martes (tu día más productivo)");
  }
  
  // Basado en ROI
  const mejorArea = areaConMayorROI();
  sugerencias.push(`Área ${mejorArea} tiene ROI alto - invierte más tiempo aquí`);
  
  // Basado en carga
  if (cargaProyectada > 100) {
    sugerencias.push("Semana sobrecargada - considera posponer 3 tareas no urgentes");
  }
  
  return sugerencias;
}
```

**Categorías de Insights:**

**A) Rendimiento**
- [ ] "Tu productividad aumentó 22% este mes vs anterior"
- [ ] "Completaste 85% de tus metas prioritarias - ¡excelente!"
- [ ] "Área Vocacional está por debajo del promedio - necesita atención"

**B) Bienestar**
- [ ] "Tu mood bajó 15% en las últimas 2 semanas - considera descansar"
- [ ] "Riesgo de burnout: MEDIO - reduce carga esta semana"
- [ ] "No has registrado actividad física en 10 días - agenda ejercicio"

**C) Optimización**
- [ ] "Redistribuye 5 horas de Área X (ROI bajo) a Área Y (ROI alto)"
- [ ] "Elimina tareas en Cuadrante 4 - no aportan valor"
- [ ] "Delega tareas urgentes pero no importantes"

**D) Patrones**
- [ ] "Eres 40% más productivo los Martes entre 9-11am"
- [ ] "Metas con >3 tareas tienen 70% más probabilidad de éxito"
- [ ] "Tu racha más larga fue en Febrero - ¿qué hiciste diferente?"

**E) Proyecciones**
- [ ] "Al ritmo actual, completarás 45 metas este año (objetivo: 50)"
- [ ] "Proyección: alcanzarás 300 días activos en Diciembre"
- [ ] "Meta 'Lanzar Producto' en riesgo - acelera 20% para cumplir deadline"

**Visualizaciones:**
- [ ] Panel de Insights con cards por categoría
- [ ] Gráfico de Tendencia de Productividad
- [ ] Alertas de Riesgo (rojo/amarillo/verde)
- [ ] Lista de Acciones Recomendadas (priorizadas)
- [ ] Timeline de Logros Destacados

**Benchmarks contra Promedios:**
- [ ] Tu productividad vs promedio global: +15%
- [ ] Tasa de completación vs promedio: 78% (promedio: 65%)
- [ ] Consistencia vs promedio: 210 días activos (promedio: 180)

**Plan de Acción Sugerido:**
```typescript
interface AccionRecomendada {
  prioridad: 'alta' | 'media' | 'baja';
  categoria: 'rendimiento' | 'bienestar' | 'optimizacion';
  accion: string;
  impacto: string;
  esfuerzo: 'bajo' | 'medio' | 'alto';
}

const planDeAccion: AccionRecomendada[] = [
  {
    prioridad: 'alta',
    categoria: 'bienestar',
    accion: 'Tomar 2 días de descanso esta semana',
    impacto: 'Reduce riesgo de burnout en 40%',
    esfuerzo: 'bajo'
  },
  // ... más acciones
];
```

**Componentes a Crear:**
- [ ] `QuarterlyComparisonReport.tsx` - Comparativa trimestral
- [ ] `StreaksReport.tsx` - Calendario de contribuciones y rachas
- [ ] `AIInsightsReport.tsx` - Insights y recomendaciones automáticas
- [ ] Hook: `useQuarterlyAnalytics()` - Cálculos trimestrales
- [ ] Hook: `useStreaksAnalytics()` - Cálculos de rachas
- [ ] Hook: `useAIInsights()` - Generación de insights
- [ ] Componente: `ContributionCalendar.tsx` - Heatmap anual estilo GitHub
- [ ] Componente: `InsightCard.tsx` - Card para mostrar un insight
- [ ] Componente: `ActionPlan.tsx` - Lista de acciones recomendadas
- [ ] Actualizar `ReportsPage.tsx` con 3 tabs nuevos en Categoría 4

**Nota:** La "IA" en esta fase son algoritmos basados en reglas y estadística descriptiva. La integración con LLMs reales (OpenAI/Claude) se hará en Fase 15.

---

## ⏳ FASE 15: Preparación para IA (Futura) (Pendiente - 0%)

**Objetivo:** Infraestructura base para integración futura de IA

### **15.1 UI para Acciones IA**
- [ ] Crear sección "🤖 Acciones IA" en Dashboard
- [ ] Botones placeholder con iconos:
  - "💬 Crear Tarea por IA"
  - "📝 Registrar Avance por IA"
  - "📊 Generar Reporte por IA"
  - "🔍 Análisis Semanal por IA"
  - "💡 Sugerencias Personalizadas"
- [ ] Modal con textarea para prompt del usuario
- [ ] Loading state mientras "procesa"
- [ ] Respuesta simulada por ahora

### **15.2 Backend Preparado**
- [ ] Crear endpoint `POST /api/ai/action`
- [ ] Request body:
  ```typescript
  {
    action: 'create_task' | 'log_progress' | 'generate_report' | 'analyze_week',
    prompt: string,
    context?: { areaId?, goalId? }
  }
  ```
- [ ] Response structure:
  ```typescript
  {
    success: boolean,
    data: any,
    suggestions?: string[]
  }
  ```
- [ ] Por ahora retornar respuesta mock

### **15.3 Estructura de Datos para IA**
- [ ] Crear tabla `ai_conversations` (opcional):
  - id, user_id, prompt, response, action_taken, created_at
- [ ] Endpoint para historial de IA: `GET /api/ai/history`
- [ ] Botón "Repetir acción anterior"

**Componentes a Crear:**
- [ ] `AIActionsPanel.tsx`
- [ ] `AIPromptModal.tsx`
- [ ] Hook: `useAIAction()`
- [ ] Backend: `server/routes/ai.ts` (placeholder)

**Nota:** Esta fase prepara la UI y estructura, pero la integración real con OpenAI/Claude se hará en el futuro.

---

## ⏳ FASE 16: Validación & Testing (Pendiente - 0%)

### **13.1 Testing de Integración**
- [ ] Tests end-to-end con Playwright/Cypress
- [ ] Flujos críticos:
  - Crear área → meta → tarea → marcar completa → verificar progreso
  - Registrar avance → verificar en reporte ejecutivo
  - Crear documento → verificar alerta de revisión
- [ ] Tests de API con Supertest
- [ ] Tests de componentes con Testing Library

### **13.2 Manejo de Errores**
- [ ] Error boundaries en React
- [ ] Toast notifications para errores
- [ ] Retry automático en failed requests
- [ ] Fallback UI para errores de carga
- [ ] Logging de errores (Sentry opcional)

### **13.3 Validación de Datos**
- [ ] Verificar integridad referencial (FK constraints)
- [ ] Validación de fechas (no futuras donde no aplique)
- [ ] Límites de caracteres respetados
- [ ] Campos requeridos validados
- [ ] Tests de edge cases

---

## ⏳ FASE 17: Optimización Final (Pendiente - 0%)

### **14.1 Performance**
- [ ] Lazy loading de páginas
- [ ] Code splitting por rutas
- [ ] Optimización de queries (select only needed fields)
- [ ] Memoización de cálculos pesados
- [ ] Virtual scrolling en listas largas

### **14.2 Caché y Sincronización**
- [ ] Configurar staleTime en TanStack Query
- [ ] Prefetching de datos relacionados
- [ ] Optimistic updates
- [ ] Background refetch

### **14.3 Limpieza de Código**
- [ ] Eliminar código legacy (localStorage si existe)
- [ ] Eliminar console.logs
- [ ] Linting completo (ESLint + Prettier)
- [ ] TypeScript strict mode
- [ ] Documentación de funciones complejas

### **14.4 Documentación**
- [ ] README.md completo:
  - Setup instructions
  - Environment variables
  - Database schema
  - API endpoints documentation
- [ ] Comentarios en código crítico
- [ ] Changelog de versiones

### **14.5 Deployment**
- [ ] Build de producción optimizado
- [ ] Variables de entorno para prod
- [ ] CI/CD pipeline (opcional)
- [ ] Monitoreo de errores
- [ ] Backup de base de datos

---

## 📋 MÉTRICAS DE PROGRESO

### **Fases Completadas: 8/17 (47%)**

| Categoría | Completado | Pendiente | Total |
|-----------|-----------|-----------|-------|
| Backend | 1/1 | 0/1 | 100% |
| Services | 1/1 | 0/1 | 100% |
| CRUD Pages | 6/6 | 0/6 | 100% |
| Reports Analytics | 1/4 | 3/4 | 25% |
| UI/UX | 0/1 | 1/1 | 0% |
| Paneles Especializados | 0/1 | 1/1 | 0% |
| Vistas Avanzadas | 0/1 | 1/1 | 0% |
| Preparación IA | 0/1 | 1/1 | 0% |
| Testing | 0/1 | 1/1 | 0% |
| Optimización | 0/1 | 1/1 | 0% |

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### **RECOMENDACIÓN: Ejecutar Fase 9 (UI/UX) AHORA**

**Razones:**
1. ✅ Toda la funcionalidad CRUD está completa
2. ✅ Los reportes principales ya están implementados
3. ✅ Es el momento óptimo para rediseñar con base sólida
4. ✅ Los reportes restantes se beneficiarán del nuevo diseño
5. ✅ Mejor experiencia de usuario desde ya

**Duración estimada:** 3-5 días de trabajo

**Resultado esperado:**
- 🎨 Aplicación con look & feel profesional
- 🚀 Mejora significativa en UX
- 💎 Diseño consistente en todas las páginas
- ⚡ Animaciones y micro-interacciones fluidas

---

## 🎯 ORDEN DE EJECUCIÓN SUGERIDO

```
✅ Fases 1-8 (COMPLETADAS)
👉 Fase 9: UI/UX Professional Redesign  ⭐ SIGUIENTE RECOMENDADA
   Fase 10: Paneles Especializados por Área
   Fase 11: Vistas Avanzadas y Filtros
   Fase 12: Reports Analytics Fase 2 (Forecast, Carga, Prioridades)
   Fase 13: Reports Analytics Fase 3 (Patrones, ROI, Ciclo de Vida)
   Fase 14: Reports Analytics Fase 4 (Trimestral, Streaks, IA Insights)
   Fase 15: Preparación para IA (Futura)
   Fase 16: Validación & Testing
   Fase 17: Optimización Final
```

---

## 📞 DECISIÓN REQUERIDA

**¿Procedemos con Fase 9 (UI/UX Professional Redesign)?**

- ✅ **SÍ** → Mejoramos toda la experiencia visual ahora
- ⏭️ **NO** → Continuamos con reportes restantes (Fase 10-12)

**Tu decisión determinará el siguiente paso de implementación.**
