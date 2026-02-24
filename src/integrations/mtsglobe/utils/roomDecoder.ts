import roomMapping from './room_mapping.json';

/**
 * MTS Globe Room Decoder
 * 
 * Decodes vendor-specific room codes into human-readable descriptions
 * using the mapping extracted from Room_Mapping.xlsx
 */
export const decodeRoomCode = (
    base?: string,
    grade?: string,
    subtype?: string,
    type?: string,
    view?: string
): string => {
    const parts: string[] = [];

    // Order of components for a readable name
    if (type && (roomMapping.TYPE as any)[type]) {
        parts.push((roomMapping.TYPE as any)[type]);
    }

    if (subtype && (roomMapping.SUBTYPE as any)[subtype]) {
        parts.push((roomMapping.SUBTYPE as any)[subtype]);
    }

    if (grade && (roomMapping.GRADE as any)[grade]) {
        parts.push((roomMapping.GRADE as any)[grade]);
    }

    if (view && (roomMapping.VIEW as any)[view]) {
        parts.push((roomMapping.VIEW as any)[view]);
    }

    // Base often contains generic info like number of beds
    if (base && (roomMapping.BASE as any)[base]) {
        const baseVal = (roomMapping.BASE as any)[base];
        if (!parts.some(p => p.includes(baseVal))) {
            parts.push(baseVal);
        }
    }

    const decoded = parts.filter(Boolean).join(' ');
    return decoded || 'Standard Room';
};

/**
 * Helper to decode a combined code if provided in a specific format
 * Example: "DBL.SEA.SUP" could be split and decoded
 */
export const decodeCombinedCode = (combinedCode: string): string => {
    // This depends on the actual XML response format which we'll see later
    // For now, it's a placeholder for more complex logic
    return combinedCode;
};
