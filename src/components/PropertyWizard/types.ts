import type { Property } from '../../types/property.types';

export interface PropertyWizardProps {
    onClose: () => void;
    onSave: (property: Partial<Property>, shouldClose?: boolean) => void;
    initialData?: Partial<Property>;
}

export interface StepProps {
    data: Partial<Property>;
    onChange: (updates: Partial<Property>) => void;
}

export interface AIPromptHistory {
    id: string;
    userId: string;
    userName: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    impactedFields?: string[];
}

export interface Step {
    id: string;
    title: string;
    icon: React.ReactNode;
}
