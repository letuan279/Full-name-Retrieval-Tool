/**
 * Application Constants
 * Centralized constants for the application
 */

// Storage keys for localStorage
export const STORAGE_KEYS = {
    STUDENT_INFO: 'studentInfo',
    THEME: 'theme',
    TABLE_DATA: 'tableData'
}

// Processing constants
export const PROCESSING = {
    BATCH_SIZE: 10,
    DEBOUNCE_DELAY: 200, // milliseconds for search debounce
    RETRY_DELAY: 1000, // milliseconds
    MAX_RETRIES: 3
}

// UI constants
export const UI = {
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    PAGINATION: {
        DEFAULT_ITEMS_PER_PAGE: 10,
        MAX_ITEMS_PER_PAGE: 50
    },
    MODAL: {
        ANIMATION_DURATION: 300 // milliseconds
    }
}

// Text processing constants
export const TEXT_PROCESSING = {
    MIN_NGRAM_LENGTH: 3,
    SIMILARITY_THRESHOLD: 0.7,
    MAX_MESSAGE_LENGTH: 1000
}

// Validation constants
export const VALIDATION = {
    MIN_STUDENT_NAME_LENGTH: 2,
    MAX_STUDENT_NAME_LENGTH: 100,
    MIN_MESSAGE_LENGTH: 5,
    MAX_BATCH_SIZE: 50
}

// Status constants
export const STATUS = {
    EXTRACTION: {
        NULL: 'NULL',
        ERROR: 'ERROR',
        SUCCESS: 'SUCCESS'
    },
    PROCESSING: {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error'
    }
}

// Message types for notifications
export const MESSAGE_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}

// File formats
export const FILE_FORMATS = {
    SUPPORTED_EXCEL_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ENCODING: 'UTF-8'
}

// Default values
export const DEFAULTS = {
    THEME: UI.THEMES.LIGHT,
    ITEMS_PER_PAGE: UI.PAGINATION.DEFAULT_ITEMS_PER_PAGE,
    TEMPERATURE: 0.6,
    CURRENT_PAGE: 1
}
