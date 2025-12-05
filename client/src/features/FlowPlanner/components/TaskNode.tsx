import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getGoalColor } from '../utils/goalColors';
import { PlannerTask } from '../types';

interface TaskNodeData extends PlannerTask {
    label: string;
}

export const TaskNode = memo(({ data }: NodeProps<TaskNodeData>) => {
    const colors = getGoalColor(data.goal_id);

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2
        ${colors.bg} ${colors.border}
        min-w-[200px] max-w-[250px]
        shadow-md hover:shadow-xl
        transition-all
      `}
        >
            {/* Handle de entrada (izquierda) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />

            {/* Badge de meta */}
            {data.goal_title && (
                <div className={`text-[9px] font-semibold uppercase tracking-wider ${colors.text} mb-1`}>
                    🎯 {data.goal_title}
                </div>
            )}

            {/* Título de tarea */}
            <div className="font-medium text-sm text-gray-900 leading-tight mb-2">
                {data.title}
            </div>

            {/* Metadata */}
            <div className="flex gap-2 text-xs">
                {data.calculated_priority && (
                    <span className="px-2 py-0.5 bg-white rounded text-gray-700 border border-gray-300">
                        {data.calculated_priority}
                    </span>
                )}
                {data.estimated_duration && (
                    <span className="text-gray-600">
                        {Math.round(data.estimated_duration / 60)}h
                    </span>
                )}
            </div>

            {/* Handle de salida (derecha) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />
        </div>
    );
});

TaskNode.displayName = 'TaskNode';
