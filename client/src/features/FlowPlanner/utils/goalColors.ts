/**
 * Utility functions for consistent goal coloring across all planner views
 */

interface GoalColorTheme {
    bg: string;
    text: string;
    border: string;
    bgHover: string;
}

const COLOR_PALETTE: GoalColorTheme[] = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bgHover: 'hover:bg-blue-100' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', bgHover: 'hover:bg-green-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bgHover: 'hover:bg-purple-100' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', bgHover: 'hover:bg-orange-100' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', bgHover: 'hover:bg-pink-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', bgHover: 'hover:bg-teal-100' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bgHover: 'hover:bg-indigo-100' },
    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bgHover: 'hover:bg-red-100' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', bgHover: 'hover:bg-yellow-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', bgHover: 'hover:bg-cyan-100' },
];

/**
 * Simple string hash function for consistent color assignment
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Get consistent color theme for a goal ID
 * @param goalId - The goal ID (or 'NO_GOAL' for tasks without a goal)
 * @returns GoalColorTheme object with bg, text, border, and bgHover classes
 */
export function getGoalColor(goalId: string | null | undefined): GoalColorTheme {
    const id = goalId || 'NO_GOAL';
    const hash = hashString(id);
    const index = hash % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

/**
 * Generate a mapping of goal IDs to colors for a list of tasks
 * @param tasks - Array of tasks with goal_id property
 * @returns Record of goal_id to GoalColorTheme
 */
export function getGoalColorMap(tasks: Array<{ goal_id?: string | null }>): Record<string, GoalColorTheme> {
    const colorMap: Record<string, GoalColorTheme> = {};
    const uniqueGoalIds = Array.from(new Set(tasks.map(t => t.goal_id || 'NO_GOAL')));

    uniqueGoalIds.forEach(goalId => {
        colorMap[goalId] = getGoalColor(goalId);
    });

    return colorMap;
}

/**
 * Generate task ID in format: PREFIX-G#-T#
 * @param projectTitle - Project title to generate prefix from
 * @param goalId - Goal ID
 * @param taskIndex - Index of task in the list
 * @param allGoalIds - Array of all unique goal IDs to determine goal index
 * @returns Formatted task ID string
 */
export function generateTaskId(
    projectTitle: string,
    goalId: string | null | undefined,
    taskIndex: number,
    allGoalIds: string[]
): string {
    const projectPrefix = projectTitle
        ? projectTitle.substring(0, 3).toUpperCase()
        : 'PRJ';

    const id = goalId || 'NO_GOAL';
    const goalIndex = allGoalIds.indexOf(id) + 1;

    return `${projectPrefix}-G${goalIndex}-T${taskIndex + 1}`;
}
