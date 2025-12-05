import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    MiniMap,
    BackgroundVariant,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlanner } from '../PlannerContext';
import { TaskNode } from './TaskNode';
import { getLayoutedElements } from '../utils/dagre-layout';

const nodeTypes = {
    taskNode: TaskNode,
};

export function CanvasView() {
    const { state, updateTask } = usePlanner();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Inicializar nodos y edges desde las tareas
    useMemo(() => {
        const initialNodes: Node[] = state.tasks.map((task, index) => {
            // Use saved position if it exists and is not 0,0 (default)
            // Or if it's 0,0 but we want to trust it (maybe user moved it there)
            // Let's assume if x=0 and y=0 it's uninitialized for now, unless we have a flag.
            // Better strategy: If we have a position in state, use it.
            // If it's 0,0 we might want to default to grid to avoid stacking.
            const hasPosition = task.position && (task.position.x !== 0 || task.position.y !== 0);

            return {
                id: task.id,
                type: 'taskNode',
                position: hasPosition
                    ? task.position!
                    : { x: (index % 3) * 300, y: Math.floor(index / 3) * 150 },
                data: { ...task, label: task.title },
            };
        });

        const initialEdges: Edge[] = [];
        state.tasks.forEach((task) => {
            task.dependencies?.forEach((depId) => {
                initialEdges.push({
                    id: `${depId}-${task.id}`,
                    source: depId,
                    target: task.id,
                    type: 'smoothstep',
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#6366f1',
                    },
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                });
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [state.tasks]); // Solo recalcular cuando cambian las tareas

    // Handle node drag stop to save position
    const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
        updateTask(node.id, {
            position: { x: node.position.x, y: node.position.y }
        });
    }, [updateTask]);

    // Detectar ciclos
    const detectCycle = useCallback((newEdge: Connection): boolean => {
        const graph = new Map<string, string[]>();

        // Construir grafo con el nuevo edge
        [...edges, { source: newEdge.source!, target: newEdge.target! }].forEach(({ source, target }) => {
            if (!graph.has(source)) graph.set(source, []);
            graph.get(source)!.push(target);
        });

        // DFS para detectar ciclos
        const visited = new Set<string>();
        const recStack = new Set<string>();

        const dfs = (node: string): boolean => {
            visited.add(node);
            recStack.add(node);

            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true; // Ciclo detectado
                }
            }

            recStack.delete(node);
            return false;
        };

        return dfs(newEdge.source!);
    }, [edges]);

    // Manejar nueva conexión
    const onConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;

            // Verificar ciclos
            if (detectCycle(connection)) {
                alert('⚠️ No se puede crear esta dependencia: se detectó un ciclo circular.');
                return;
            }

            // Actualizar edge visual
            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        type: 'smoothstep',
                        animated: true,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#6366f1',
                        },
                        style: { stroke: '#6366f1', strokeWidth: 2 },
                    },
                    eds
                )
            );

            // Actualizar dependencia en el estado
            const targetTask = state.tasks.find((t) => t.id === connection.target);
            if (targetTask) {
                const newDependencies = [...(targetTask.dependencies || []), connection.source];
                updateTask(connection.target, { dependencies: newDependencies });
            }
        },
        [detectCycle, setEdges, state.tasks, updateTask]
    );

    // Manejar click en edge para eliminar
    const onEdgeClick = useCallback(
        (_event: React.MouseEvent, edge: Edge) => {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));

            // Actualizar dependencia en el estado
            const targetTask = state.tasks.find((t) => t.id === edge.target);
            if (targetTask) {
                const newDependencies = (targetTask.dependencies || []).filter((d) => d !== edge.source);
                updateTask(edge.target, { dependencies: newDependencies });
            }
        },
        [setEdges, state.tasks, updateTask]
    );

    // Auto-layout con dagre
    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        // Save new positions after auto-layout
        layoutedNodes.forEach(node => {
            updateTask(node.id, {
                position: { x: node.position.x, y: node.position.y }
            });
        });
    }, [nodes, edges, setNodes, setEdges, updateTask]);

    return (
        <div className="w-full h-[600px] bg-gray-50 rounded-lg border border-gray-200">
            {/* Header con controles */}
            <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">Canvas Visual de Dependencias</h3>
                    {state.project_title && (
                        <p className="text-xs text-gray-600">📋 Proyecto: {state.project_title}</p>
                    )}
                </div>
                <button
                    onClick={onLayout}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                    ✨ Auto-Layout
                </button>
            </div>

            {/* React Flow Canvas */}
            <div className="h-[calc(100%-60px)]">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeClick={onEdgeClick}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                >
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            const task = state.tasks.find((t) => t.id === node.id);
                            return task?.goal_id ? '#818cf8' : '#d1d5db';
                        }}
                        maskColor="rgba(0, 0, 0, 0.1)"
                    />
                </ReactFlow>
            </div>

            {/* Helper text */}
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800">
                💡 Tip: Arrastra desde el punto derecho de una tarea hacia otra para crear dependencia.
                Click en la línea para eliminarla.
            </div>
        </div>
    );
}
