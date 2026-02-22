import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * A hook to manage state that is synchronized with the URL query parameters.
 * 
 * @param key The query parameter key (e.g., 'tab', 'view')
 * @param defaultValue The default value if the parameter is missing
 * @returns [value, setValue] tuple
 */
export function useQueryState<T extends string>(key: string, defaultValue: T): [T, (newValue: T) => void] {
    const [searchParams, setSearchParams] = useSearchParams();

    // Memoize the current value to avoid unnecessary re-renders
    const value = useMemo(() => {
        return (searchParams.get(key) as T) || defaultValue;
    }, [searchParams, key, defaultValue]);

    const setValue = useCallback((newValue: T) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (newValue === defaultValue) {
                newParams.delete(key);
            } else {
                newParams.set(key, newValue);
            }
            return newParams;
        }, { replace: true });
    }, [key, defaultValue, setSearchParams]);

    return [value, setValue];
}
