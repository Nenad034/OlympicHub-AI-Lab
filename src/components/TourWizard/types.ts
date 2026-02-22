import type { Tour } from '../../types/tour.types';

export interface StepProps {
    data: Partial<Tour>;
    onChange: (updates: Partial<Tour>) => void;
}
