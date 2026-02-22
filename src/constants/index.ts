/**
 * Application Constants
 * Centralized configuration values
 */

// User Levels
export const USER_LEVELS = {
    GUEST: 1,
    BASIC: 2,
    STANDARD: 3,
    ADVANCED: 4,
    EXPERT: 5,
    MASTER: 6,
} as const;

export type UserLevel = typeof USER_LEVELS[keyof typeof USER_LEVELS];

export const USER_LEVEL_NAMES: Record<UserLevel, string> = {
    1: 'Gost',
    2: 'Osnovni',
    3: 'Standardni',
    4: 'Napredni',
    5: 'Ekspert',
    6: 'Master Administrator',
};

// Property Types
export const PROPERTY_TYPES = [
    'Hotel',
    'Apartment',
    'Villa',
    'Resort',
    'Motel',
    'Hostel',
    'BedAndBreakfast',
    'GuestHouse',
    'Pension',
] as const;

export type PropertyType = typeof PROPERTY_TYPES[number];

// Themes
export const THEMES = ['light', 'navy', 'tokyo-light'] as const;
export type Theme = typeof THEMES[number];

// Languages
export const LANGUAGES = ['sr', 'en'] as const;
export type Language = typeof LANGUAGES[number];

// Navigation Modes
export const NAV_MODES = ['sidebar', 'horizontal'] as const;
export type NavMode = typeof NAV_MODES[number];

// Module IDs
export const MODULE_IDS = {
    DASHBOARD: 'dashboard',
    PRODUCTION: 'production',
    SUPPLIERS: 'suppliers',
    CUSTOMERS: 'customers',
    SETTINGS: 'settings',
    KATANA: 'katana',
    DEEP_ARCHIVE: 'deep-archive',
    FORTRESS: 'fortress',
    MARS_ANALYSIS: 'mars-analysis',
} as const;

export type ModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS];

// API Endpoints
export const API_ENDPOINTS = {
    PROPERTIES: 'properties',
    SUPPLIERS: 'suppliers',
    CUSTOMERS: 'customers',
    BOOKINGS: 'bookings',
    CONFIG: 'app_config',
    TASKS: 'tasks',
    ACTIVITY_LOG: 'activity_log',
} as const;

// Cache Keys
export const CACHE_KEYS = {
    PROPERTIES: 'properties',
    SUPPLIERS: 'suppliers',
    CUSTOMERS: 'customers',
    CONFIG: 'config',
    USER_PREFERENCES: 'user_preferences',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    THEME: 'theme',
    LANGUAGE: 'lang',
    USER_LEVEL: 'user-level',
    SIDEBAR_COLLAPSED: 'sidebar-collapsed',
    NAV_MODE: 'nav-mode',
    HOTELS_CACHE: 'olympic_hub_hotels',
    APPS_ORDER: 'hub-apps-order',
    IS_PRISM: 'isPrism',
} as const;

// Toast Durations (ms)
export const TOAST_DURATIONS = {
    SHORT: 3000,
    NORMAL: 5000,
    LONG: 8000,
    PERSISTENT: 0,
} as const;

// Animation Durations (ms)
export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

// Breakpoints (px)
export const BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1440,
} as const;

// Date Formats
export const DATE_FORMATS = {
    SHORT: 'dd.MM.yyyy',
    LONG: 'dd. MMMM yyyy.',
    WITH_TIME: 'dd.MM.yyyy HH:mm',
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Currency
export const CURRENCIES = ['EUR', 'USD', 'RSD', 'BAM', 'HRK'] as const;
export type Currency = typeof CURRENCIES[number];

export default {
    USER_LEVELS,
    PROPERTY_TYPES,
    THEMES,
    LANGUAGES,
    NAV_MODES,
    MODULE_IDS,
    API_ENDPOINTS,
    CACHE_KEYS,
    STORAGE_KEYS,
    TOAST_DURATIONS,
    ANIMATION,
    BREAKPOINTS,
    DATE_FORMATS,
    CURRENCIES,
};
