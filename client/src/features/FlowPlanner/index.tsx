import React from 'react';
import { PlannerProvider } from './PlannerContext';
import { PlannerLayout } from './components/PlannerLayout';

export function FlowPlannerModule() {
    return (
        <PlannerProvider>
            <PlannerLayout />
        </PlannerProvider>
    );
}
