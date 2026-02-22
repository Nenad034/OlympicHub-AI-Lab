import { useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { useNotificationStore } from '../stores';
import type { NotificationSettings } from '../stores';

export const useNotificationCenter = () => {
    const { addToast } = useToast();
    const { settings } = useNotificationStore();

    const notify = useCallback((
        module: keyof NotificationSettings,
        type: 'success' | 'error' | 'warning' | 'info',
        title: string,
        message?: string
    ) => {
        const moduleSettings = settings[module];

        if (!moduleSettings.enabled) return;

        addToast({
            type,
            title,
            message,
            duration: moduleSettings.duration * 1000 // convert to ms
        });
    }, [addToast, settings]);

    return { notify };
};
