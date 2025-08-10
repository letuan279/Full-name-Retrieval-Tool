/**
 * API Configuration
 * Centralized configuration for all API-related settings
 */

export const API_CONFIG = {
    GROQ: {
        baseUrl: 'https://api.groq.com',
        apiKeys: Object.keys(import.meta.env)
            .filter(key => key.startsWith('VITE_API_KEY'))
            .map(key => import.meta.env[key])
            .filter(Boolean),
        models: [
            {
                id: "llama-3.1-8b-instant",
                contextWindow: 8000,
                description: "Fast and efficient for quick processing"
            },
            {
                id: "llama3-8b-8192",
                contextWindow: 8192,
                description: "Standard model with good balance"
            },
            {
                id: "llama3-groq-8b-8192-tool-use-preview",
                contextWindow: 8192,
                description: "Preview model with tool support"
            },
        ],
        retryAttempts: 3,
        retryDelay: 1000, // milliseconds
        batchSize: 10,
        temperature: 0.6,
        maxTokens: 8000,
        topP: 1,
        stream: false,
        responseFormat: {
            type: "json_object"
        }
    }
}

/**
 * Validate API configuration
 * @returns {boolean} True if configuration is valid
 * @throws {Error} If configuration is invalid
 */
export function validateApiConfig() {
    if (!API_CONFIG.GROQ.apiKeys.length) {
        throw new Error('No Groq API keys found. Please set VITE_GROQ_API_KEYS environment variable.')
    }

    if (!API_CONFIG.GROQ.models.length) {
        throw new Error('No models configured for Groq API.')
    }

    return true
}

/**
 * Get current API configuration with validation
 * @returns {Object} Validated API configuration
 */
export function getApiConfig() {
    validateApiConfig()
    return API_CONFIG
}
