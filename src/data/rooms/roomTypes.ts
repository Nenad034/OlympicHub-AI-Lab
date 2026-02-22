export interface RoomPrefix {
    code: string;
    name: string;
}

export interface RoomView {
    code: string;
    name: string;
}

export interface RoomBase {
    id: string;
    name: string; // npr. "Dvokrevetna soba"
    capacity: string; // npr. "2+0"
    basicBeds: number;
    extraBeds: number;
}

// 1. PREFIKSI
export const ROOM_PREFIXES: RoomPrefix[] = [
    { code: '', name: '- Bez Prefiksa -' },
    { code: 'STD', name: 'Standard' },
    { code: 'SUP', name: 'Superior' },
    { code: 'DLX', name: 'De Luxe' },
    { code: 'EXE', name: 'Executive' },
    { code: 'CLS', name: 'Classic' },
    { code: 'CMF', name: 'Comfort' },
    { code: 'PRM', name: 'Premium' },
    { code: 'DUP', name: 'DUPLEX' },
];

// 2. POGLEDI
export const ROOM_VIEWS: RoomView[] = [
    { code: '', name: '- Standardni/Bez pogleda -' },
    { code: 'PV', name: 'Pogled vrt' },
    { code: 'BPM', name: 'Bočni pogled more' },
    { code: 'PM', name: 'Pogled more' },
    { code: 'PB', name: 'Pogled bazen' },
    { code: 'PL', name: 'Pogled planina' },
];

// 3. OSNOVNI TIPOVI (Baza)
export const ROOM_TYPES: RoomBase[] = [
    // Dvokrevetne
    { id: 'dbl_2_0', name: 'Dvokrevetna soba', capacity: '2+0', basicBeds: 2, extraBeds: 0 },
    { id: 'dbl_2_1', name: 'Dvokrevetna soba', capacity: '2+1', basicBeds: 2, extraBeds: 1 },
    { id: 'dbl_2_2', name: 'Dvokrevetna soba', capacity: '2+2', basicBeds: 2, extraBeds: 2 },

    // Trokrevetne
    { id: 'tpl_3_0', name: 'Trokrevetna soba', capacity: '3+0', basicBeds: 3, extraBeds: 0 },

    // Porodične
    { id: 'fam_2_1', name: 'Porodična soba', capacity: '2+1', basicBeds: 2, extraBeds: 1 },
    { id: 'fam_2_2', name: 'Porodična soba', capacity: '2+2', basicBeds: 2, extraBeds: 2 },
    { id: 'fam_2_3', name: 'Porodična soba', capacity: '2+3', basicBeds: 2, extraBeds: 3 },

    // Apartmani (Dodatak za svaki slučaj)
    { id: 'app_2_2', name: 'Apartman', capacity: '2+2', basicBeds: 2, extraBeds: 2 },
];
