// =========================================================
// SITE CONFIGURATION - ENVIRONMENT SETTINGS
// =========================================================

(function () {
    'use strict';
    // Detect environment based on hostname
    //const hostname = window.location.hostname;
    const isDevelopment = false; // Force production for all environments
    const isProduction = true;

    // Configuration object
    window.SITE_CONFIG = {
        // Environment
        environment: isDevelopment ? 'development' : 'production',

        // API Configuration
        apiUrl: isDevelopment
            ? 'https://api-mohammadbourm.runasp.net/api'
            : 'https://api-mohammadbourm.runasp.net/api',

        // Feature Flags
        enableLogging: isDevelopment,
        enableAnalytics: isProduction,
        enableSecurityMonitoring: true,

        // Rate Limiting
        rateLimitAttempts: 3,
        rateLimitWindow: 900000, // 15 minutes in milliseconds

        // Timeouts
        requestTimeout: 30000, // 30 seconds

        // Version
        version: '1.0.0',
        buildDate: '2025-02-06',

        // Security
        csrfEnabled: true,
        honeypotEnabled: true,

        // Contact Info (Public)
        contactEmail: 'mohammadbourm@gmail.com',
        contactPhone: '+971522933130',

        // Social Links (Public)
        social: {
            linkedin: 'https://www.linkedin.com/in/mohammad-al-bourm-067337166',
            github: 'https://github.com/MohammadAhmadAlBourm',
            twitter: 'https://x.com/BourmMohammad'
        }
    };

    // Freeze configuration to prevent modification
    Object.freeze(window.SITE_CONFIG);
    Object.freeze(window.SITE_CONFIG.social);
})();
