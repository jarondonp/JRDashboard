
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GanttTask, ViewMode } from './types';

interface GanttChartProps {
    tasks: GanttTask[];
    startDate?: Date; // Project start date
    onTaskUpdate?: (taskId: string, newStartDate: string, newDueDate: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, startDate, onTaskUpdate }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('Day');
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);

    // Drag state for bars
    const [dragState, setDragState] = useState<{
        taskId: string;
        startX: number;
        currentX: number;
        originalStart: Date;
        originalEnd: Date;
    } | null>(null);

    // Calculate timeline bounds
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (tasks.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0 };

        const dates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.due_date)]);
        if (startDate) dates.push(startDate);

        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        // Add buffer
        max.setDate(max.getDate() + 5);

        const diffTime = Math.abs(max.getTime() - min.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays: days };
    }, [tasks, startDate]);

    // Generate calendar headers
    const calendarHeaders = useMemo(() => {
        const headers = [];
        const current = new Date(minDate);
        for (let i = 0; i <= totalDays; i++) {
            headers.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return headers;
    }, [minDate, totalDays]);

    const getGridPosition = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);

        const startOffset = Math.ceil((s.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

        // +2 because grid lines start at 1, and column 1 is Task Name
        return {
            gridColumnStart: startOffset + 2,
            gridColumnEnd: startOffset + 2 + (duration || 1)
        };
    };

    // Resizing logic for sidebar
    const startResizing = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    // Drag logic for bars
    const handleBarMouseDown = (e: React.MouseEvent, task: GanttTask) => {
        if (!onTaskUpdate) return;
        e.preventDefault();
        e.stopPropagation(); // Prevent sidebar resizing or other events
        setDragState({
            taskId: task.id,
            startX: e.clientX,
            currentX: e.clientX,
            originalStart: new Date(task.start_date),
            originalEnd: new Date(task.due_date)
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                setSidebarWidth(prev => {
                    const newWidth = prev + e.movementX;
                    return Math.max(100, Math.min(600, newWidth));
                });
            }

            if (dragState) {
                setDragState(prev => prev ? { ...prev, currentX: e.clientX } : null);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);

            if (dragState) {
                const deltaPixels = dragState.currentX - dragState.startX;
                const dayWidth = 50; // Fixed width
                const deltaDays = Math.round(deltaPixels / dayWidth);

                if (deltaDays !== 0) {
                    // Use UTC methods to avoid timezone issues
                    const origStart = dragState.originalStart;
                    const newStartMs = Date.UTC(
                        origStart.getUTCFullYear(),
                        origStart.getUTCMonth(),
                        origStart.getUTCDate() + deltaDays
                    );

                    const origEnd = dragState.originalEnd;
                    const newEndMs = Date.UTC(
                        origEnd.getUTCFullYear(),
                        origEnd.getUTCMonth(),
                        origEnd.getUTCDate() + deltaDays
                    );

                    // Format as YYYY-MM-DD using UTC
                    const formatUTC = (ms: number) => {
                        const d = new Date(ms);
                        const year = d.getUTCFullYear();
                        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(d.getUTCDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };

                    const newStartStr = formatUTC(newStartMs);
                    const newEndStr = formatUTC(newEndMs);

                    console.log(`📅 [GanttChart] Drag update: ${dragState.taskId} -> ${newStartStr} to ${newEndStr}`);

                    onTaskUpdate?.(dragState.taskId, newStartStr, newEndStr);
                }
                setDragState(null);
            }
        };

        if (isResizing || dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isResizing ? 'col-resize' : 'grabbing';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing, dragState, onTaskUpdate]);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex flex-col h-[600px]">
            {/* Controls */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-semibold text-gray-700">Cronograma del Proyecto</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs font-medium bg-white border rounded hover:bg-gray-50">Día</button>
                    <button className="px-3 py-1 text-xs font-medium bg-white border rounded hover:bg-gray-50 opacity-50 cursor-not-allowed">Semana</button>
                </div>
            </div>

            {/* Chart Container - Scrollable */}
            <div className="overflow-auto relative flex-1">
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `${sidebarWidth}px repeat(${totalDays + 1}, 50px)`,
                        minWidth: '100%'
                    }}
                >
                    {/* Header Row */}
                    <div
                        className="sticky top-0 left-0 z-30 bg-gray-100 border-b border-gray-200 border-r border-gray-200 p-2 font-medium text-sm text-gray-800 shadow-sm flex justify-between items-center group"
                        style={{ gridColumn: '1 / 2', gridRow: '1' }}
                    >
                        <span>Tarea</span>
                        {/* Resize Handle */}
                        <div
                            className="w-1 h-full absolute right-0 top-0 cursor-col-resize hover:bg-indigo-400 transition-colors"
                            onMouseDown={startResizing}
                        ></div>
                    </div>
                    {calendarHeaders.map((date, i) => (
                        <div key={i} className="sticky top-0 z-20 bg-gray-100 border-b border-gray-200 border-l border-gray-200 p-1 text-xs text-center text-gray-500 flex flex-col justify-center">
                            <span className="font-bold">{date.getDate()}</span>
                            <span className="text-[10px]">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        </div>
                    ))}

                    {/* Task Rows */}
                    {tasks.map((task, i) => {
                        const isDragging = dragState?.taskId === task.id;
                        const dragOffset = isDragging ? dragState.currentX - dragState.startX : 0;

                        return (
                            <React.Fragment key={task.id}>
                                {/* Task Name Column - STICKY & EXPLICIT GRID PLACEMENT */}
                                <div
                                    className={`sticky left-0 z-10 border-b border-gray-100 border-r border-gray-200 text-sm flex items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                    style={{
                                        width: sidebarWidth,
                                        gridColumn: '1 / 2',
                                        gridRow: i + 2
                                    }}
                                    title={task.title}
                                >
                                    <div className="truncate px-2 w-full text-gray-900 font-medium">
                                        {task.title}
                                    </div>
                                    {/* Resize Handle for rows too (visual consistency) */}
                                    <div
                                        className="w-1 h-full absolute right-0 top-0 cursor-col-resize hover:bg-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                                        onMouseDown={startResizing}
                                    ></div>
                                </div>

                                {/* Timeline Cells (Background Grid) */}
                                {calendarHeaders.map((_, j) => (
                                    <div key={j} className={`border-b border-gray-100 border-l border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}></div>
                                ))}

                                {/* Task Bar (Overlay) */}
                                <div
                                    className={`
                                        rounded-md shadow-sm text-xs text-white flex items-center justify-center px-2 relative
                                        ${task.critical ? 'bg-red-500' : 'bg-indigo-500'}
                                        hover:opacity-90 transition-opacity cursor-pointer group
                                        ${isDragging ? 'shadow-lg ring-2 ring-indigo-300' : ''}
                                    `}
                                    style={{
                                        gridRow: i + 2, // +2 because header is row 1
                                        ...getGridPosition(task.start_date, task.due_date),
                                        marginTop: '8px',
                                        marginBottom: '8px',
                                        height: '24px',
                                        transform: `translateX(${dragOffset}px)`,
                                        zIndex: isDragging ? 50 : 10,
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                    title={`${task.title} (${task.start_date} - ${task.due_date})`}
                                    onMouseDown={(e) => handleBarMouseDown(e, task)}
                                >
                                    {task.critical && <span className="mr-1">🔥</span>}
                                    {/* Tooltip on hover (hide when dragging) */}
                                    {!isDragging && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                                            {task.title} <br />
                                            <span className="text-gray-300 text-[10px]">{task.start_date} - {task.due_date}</span>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
