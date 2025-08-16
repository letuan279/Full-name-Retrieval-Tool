/**
 * Environment Configuration
 * Handles environment-specific settings and validation
 */

/**
 * Get environment type
 * @returns {string} Current environment (development, production, test)
 */
export function getEnvironment() {
    return import.meta.env.MODE || 'development'
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment() {
    return getEnvironment() === 'development'
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export function isProduction() {
    return getEnvironment() === 'production'
}

/**
 * Check if running in test mode
 * @returns {boolean} True if in test mode
 */
export function isTest() {
    return getEnvironment() === 'test'
}

/**
 * Get application configuration from environment variables
 * @returns {Object} Application configuration
 */
export function getAppConfig() {
    return {
        appName: import.meta.env.VITE_APP_NAME || 'Full-name Retrieval Tool',
        appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
        appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Tool to extract names from transaction messages and find corresponding students',

        // API Configuration
        groqApiKeys: Object.keys(import.meta.env)
            .filter(key => key.startsWith('VITE_API_KEY'))
            .map(key => import.meta.env[key])
            .filter(Boolean),

        // Feature flags
        enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
        enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',

        // UI Configuration
        defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
        maxBatchSize: parseInt(import.meta.env.VITE_MAX_BATCH_SIZE) || 10,

        // Performance settings
        debounceDelay: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY) || 200,
        retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS) || 3,
    }
}

/**
 * Validate required environment variables
 * @throws {Error} If required environment variables are missing
 */
export function validateEnvironment() {
    const config = getAppConfig()
    const errors = []

    // Check required API keys
    if (!config.groqApiKeys.length) {
        errors.push('At least one VITE_API_KEY_* is required (e.g., VITE_API_KEY_1, VITE_API_KEY_2, etc.)')
    }

    // Check numeric values
    if (isNaN(config.maxBatchSize) || config.maxBatchSize <= 0) {
        errors.push('VITE_MAX_BATCH_SIZE must be a positive number')
    }

    if (isNaN(config.debounceDelay) || config.debounceDelay < 0) {
        errors.push('VITE_DEBOUNCE_DELAY must be a non-negative number')
    }

    if (isNaN(config.retryAttempts) || config.retryAttempts < 0) {
        errors.push('VITE_RETRY_ATTEMPTS must be a non-negative number')
    }

    if (errors.length > 0) {
        throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
    }

    return true
}

/**
 * Get debug configuration
 * @returns {Object} Debug configuration
 */
export function getDebugConfig() {
    const config = getAppConfig()

    return {
        enabled: config.enableDebugMode,
        logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
        enablePerformanceLogging: import.meta.env.VITE_ENABLE_PERFORMANCE_LOGGING === 'true',
        enableApiLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true'
    }
}
