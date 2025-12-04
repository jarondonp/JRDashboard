import { useState, useRef, useEffect } from 'react';
import type { Project } from '../services/projectsApi';

interface ProjectFilterDropdownProps {
    selectedProject: string;
    onChange: (projectId: string) => void;
    projects: Project[];
    className?: string;
}

export function ProjectFilterDropdown({
    selectedProject,
    onChange,
    projects,
    className = '',
}: ProjectFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredProjects = projects.filter((project) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            project.title.toLowerCase().includes(term) ||
            project.code?.toLowerCase().includes(term)
        );
    });

    const selectedProjectData = projects.find((p) => p.id === selectedProject);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors"
            >
                <span className="truncate block text-sm text-gray-700">
                    {selectedProjectData ? (
                        <>
                            {selectedProjectData.code && (
                                <span className="font-mono text-xs text-indigo-600 mr-2 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    [{selectedProjectData.code}]
                                </span>
                            )}
                            {selectedProjectData.title}
                        </>
                    ) : (
                        <span className="text-gray-500">Todos los proyectos</span>
                    )}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <input
                            type="text"
                            placeholder="Buscar proyecto..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="p-1 space-y-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-indigo-50 transition-colors flex items-center ${selectedProject === '' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                }`}
                        >
                            Todos los proyectos
                        </button>
                        {filteredProjects.map((project) => (
                            <button
                                key={project.id}
                                type="button"
                                onClick={() => {
                                    onChange(project.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-indigo-50 transition-colors flex items-center truncate ${selectedProject === project.id
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'text-gray-700'
                                    }`}
                            >
                                <span className="truncate flex items-center">
                                    {project.code && (
                                        <span className="font-mono text-xs text-indigo-500 mr-2 bg-white/50 px-1 py-0.5 rounded border border-indigo-100">
                                            [{project.code}]
                                        </span>
                                    )}
                                    {project.title}
                                </span>
                            </button>
                        ))}
                        {filteredProjects.length === 0 && (
                            <div className="px-3 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                                <span className="text-xl">🔍</span>
                                No se encontraron proyectos
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
