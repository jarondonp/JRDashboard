import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { usePlanner } from '../PlannerContext';

const QUADRANTS = [
    {
        id: 'P1',
        label: 'HACER (Urgente e Importante)',
        color: 'bg-red-50 border-red-200',
        priority: 'P1',
        description: '💥 Crisis, deadlines inminentes, problemas urgentes que requieren atención inmediata'
    },
    {
        id: 'P2',
        label: 'AGENDAR (Importante, No Urgente)',
        color: 'bg-yellow-50 border-yellow-200',
        priority: 'P2',
        description: '📅 Planificación estratégica, desarrollo personal, relaciones importantes, prevención'
    },
    {
        id: 'P3',
        label: 'DELEGAR (Urgente, No Importante)',
        color: 'bg-blue-50 border-blue-200',
        priority: 'P3',
        description: '🤝 Interrupciones, algunas reuniones, actividades urgentes pero que otros pueden hacer'
    },
    {
        id: 'P4',
        label: 'ELIMINAR (Ni Urgente ni Importante)',
        color: 'bg-gray-50 border-gray-200',
        priority: 'P4',
        description: '🗑️ Distracciones, pérdidas de tiempo, actividades triviales que se pueden eliminar'
    }
];

export function EisenhowerMatrix() {
    const { state, updateTask } = usePlanner();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const taskId = active.id as string;
            const targetId = over.id as string;

            // Caso 1: Mover a un cuadrante
            const quadrant = QUADRANTS.find(q => q.id === targetId);
            if (quadrant) {
                const priorityMapping: Record<string, { impact: number; effort: number }> = {
                    'P1': { impact: 5, effort: 5 },
                    'P2': { impact: 5, effort: 2 },
                    'P3': { impact: 2, effort: 5 },
                    'P4': { impact: 1, effort: 1 }
                };

                updateTask(taskId, {
                    calculated_priority: quadrant.priority as any,
                    ...priorityMapping[quadrant.id]
                });
                return;
            }

            // Caso 2: Mover de regreso a "Sin Clasificar"
            if (targetId === 'unclassified-sidebar') {
                updateTask(taskId, {
                    calculated_priority: undefined,
                    impact: undefined,
                    effort: undefined
                });
            }
        }
    };

    const unclassifiedTasks = state.tasks.filter(t => !t.calculated_priority);
    const getTasksInQuadrant = (priority: string) =>
        state.tasks.filter(t => t.calculated_priority === priority);

    const activeTask = activeId ? state.tasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-5 gap-6 h-[calc(100vh-240px)] max-h-[calc(100vh-240px)] overflow-y-auto">
                {/* Sidebar con tareas sin clasificar (Droppable) */}
                <SidebarDroppable tasks={unclassifiedTasks} />

                {/* Matriz 2x2 */}
                <div className="col-span-4 grid grid-cols-2 gap-4 grid-rows-[1fr_1fr] h-full">
                    {QUADRANTS.map(quadrant => (
                        <Quadrant
                            key={quadrant.id}
                            quadrant={quadrant}
                            tasks={getTasksInQuadrant(quadrant.priority)}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function SidebarDroppable({ tasks }: { tasks: any[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'unclassified-sidebar',
    });

    return (
        <div
            ref={setNodeRef}
            className={`
        col-span-1 bg-white rounded-lg shadow-sm border p-4 overflow-y-auto flex flex-col transition-colors h-full min-h-0
        ${isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}
      `}
        >
            <h3 className="font-semibold text-gray-900 mb-4 sticky top-0 bg-inherit pb-2 border-b z-10 flex-shrink-0">
                Sin Clasificar ({tasks.length})
            </h3>
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {tasks.map(task => (
                    <DraggableTask key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                        Arrastra aquí para desclasificar
                    </p>
                )}
            </div>
        </div>
    );
}

function DraggableTask({ task }: { task: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
    });

    if (isDragging) {
        return (
            <div ref={setNodeRef} className="opacity-50">
                <TaskCard task={task} />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes}>
            <TaskCard task={task} />
        </div>
    );
}

function TaskCard({ task, isOverlay }: { task: any, isOverlay?: boolean }) {
    return (
        <div
            className={`
        p-3 bg-white border border-gray-200 rounded shadow-sm flex flex-col gap-2
        ${isOverlay ? 'shadow-xl scale-105 rotate-2 cursor-grabbing' : 'cursor-move hover:border-indigo-300 hover:shadow-md'}
        transition-all group
      `}
        >
            {task.goal_title && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                    {task.goal_title}
                </span>
            )}
            <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        </div>
    );
}

function Quadrant({ quadrant, tasks }: { quadrant: any; tasks: any[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: quadrant.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`
        rounded-lg border-2 border-dashed p-4 flex flex-col transition-colors h-full min-h-0
        ${quadrant.color}
        ${isOver ? 'ring-2 ring-indigo-400 ring-opacity-50' : ''}
      `}
        >
            <h3 className="font-semibold text-gray-900 mb-2 flex justify-between items-center flex-shrink-0">
                {quadrant.label}
                <span className="bg-white/50 px-2 py-1 rounded text-xs">
                    {tasks.length}
                </span>
            </h3>

            {/* Description text */}
            <p className="text-xs text-gray-600 italic mb-3 pb-3 border-b border-gray-300 flex-shrink-0">
                {quadrant.description}
            </p>

            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {tasks.map(task => (
                    <DraggableTask key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}
