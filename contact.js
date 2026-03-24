// =========================================================
// SECURE CONTACT FORM - PRODUCTION READY
// =========================================================

(function () {
    'use strict';

    // =========================================================
    // Input Validator Class
    // =========================================================
    class InputValidator {
        static sanitizeHTML(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }

        static sanitizeInput(input) {
            if (typeof input !== 'string') return '';

            return input
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim()
                .substring(0, 1000);
        }

        static validateEmail(email) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

            if (!emailRegex.test(email)) return false;
            if (email.length > 254) return false;

            return true;
        }

        static validatePhone(phone) {
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;

            return phoneRegex.test(cleaned) && cleaned.length >= 8 && cleaned.length <= 15;
        }

        static validateName(name) {
            if (name.length < 2 || name.length > 100) return false;
            const nameRegex = /^[a-zA-Z\s\-']+$/;
            return nameRegex.test(name);
        }

        static validateMessage(message) {
            if (message.length < 10 || message.length > 5000) return false;

            const words = message.split(/\s+/);
            const uniqueWords = new Set(words);

            if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
                return false;
            }

            return true;
        }

        static validateSubject(subject) {
            return subject.length >= 3 && subject.length <= 200;
        }
    }

    // =========================================================
    // Rate Limiter Class
    // =========================================================
    class RateLimiter {
        constructor(maxAttempts = 3, windowMs = 900000) {
            this.maxAttempts = maxAttempts;
            this.windowMs = windowMs;
            this.storageKey = 'form_submission_attempts';
        }

        canSubmit() {
            const attempts = this.getAttempts();
            const now = Date.now();

            const recentAttempts = attempts.filter(time => now - time < this.windowMs);

            if (recentAttempts.length >= this.maxAttempts) {
                const oldestAttempt = Math.min(...recentAttempts);
                const waitTime = this.windowMs - (now - oldestAttempt);
                const minutes = Math.ceil(waitTime / 60000);

                return {
                    allowed: false,
                    waitTime: minutes,
                    message: `Too many submission attempts. Please wait ${minutes} minute(s) before trying again.`
                };
            }

            return { allowed: true };
        }

        recordAttempt() {
            const attempts = this.getAttempts();
            const now = Date.now();

            attempts.push(now);

            const recentAttempts = attempts.filter(time => now - time < this.windowMs);

            try {
                localStorage.setItem(this.storageKey, JSON.stringify(recentAttempts));
            } catch (e) {
                console.warn('Unable to save rate limit data');
            }
        }

        getAttempts() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : [];
            } catch {
                return [];
            }
        }

        reset() {
            try {
                localStorage.removeItem(this.storageKey);
            } catch { }
        }
    }

    // =========================================================
    // CSRF Protection Class
    // =========================================================
    class CSRFProtection {
        static generateToken() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        static setToken() {
            const token = this.generateToken();
            sessionStorage.setItem('csrf_token', token);
            return token;
        }

        static getToken() {
            let token = sessionStorage.getItem('csrf_token');
            if (!token) {
                token = this.setToken();
            }
            return token;
        }

        static validateToken(token) {
            const storedToken = sessionStorage.getItem('csrf_token');
            return storedToken === token && token !== null;
        }
    }

    // =========================================================
    // Security Monitor Class
    // =========================================================
    class SecurityMonitor {
        static trackSuspiciousActivity(event, details = {}) {
            const log = {
                event,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                details
            };

            this.storeLog(log);

            if (this.isSevere(event)) {
                this.reportToServer(log);
            }
        }

        static isSevere(event) {
            const severeEvents = [
                'xss_attempt',
                'sql_injection_attempt',
                'csrf_token_mismatch',
                'rate_limit_exceeded_multiple',
                'bot_detected'
            ];

            return severeEvents.includes(event);
        }

        static storeLog(log) {
            try {
                const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
                logs.push(log);

                if (logs.length > 50) {
                    logs.shift();
                }

                localStorage.setItem('security_logs', JSON.stringify(logs));
            } catch { }
        }

        static reportToServer(log) {
            const config = window.SITE_CONFIG || {};
            if (!config.apiUrl) return;

            fetch(`${config.apiUrl}/security-log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            }).catch(() => { });
        }
    }

    // =========================================================
    // Secure Error Handler Class
    // =========================================================
    class SecureErrorHandler {
        static handle(error, context = 'general') {
            const config = window.SITE_CONFIG || {};

            if (config.enableLogging) {
                console.error(`[${context}]`, error);
            } else {
                console.error(`Error in ${context}`);
            }

            this.reportError(error, context);

            return this.getUserMessage(context);
        }

        static getUserMessage(context) {
            const messages = {
                'network': 'Unable to connect. Please check your internet connection and try again.',
                'validation': 'Please check your input and try again.',
                'rate_limit': 'Too many requests. Please wait and try again.',
                'timeout': 'Request timed out. Please try again.',
                'general': 'Something went wrong. Please try again later.'
            };

            return messages[context] || messages.general;
        }

        static reportError(error, context) {
            const config = window.SITE_CONFIG || {};
            if (!config.apiUrl || !config.enableLogging) return;

            try {
                fetch(`${config.apiUrl}/log-error`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        context,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    })
                }).catch(() => { });
            } catch { }
        }
    }

    // =========================================================
    // Secure API Client Class
    // =========================================================
    class SecureAPIClient {
        constructor(baseURL) {
            this.baseURL = baseURL;
            this.timeout = 30000;
        }

        async request(endpoint, options = {}) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                const url = `${this.baseURL}${endpoint}`;

                const headers = {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': CSRFProtection.getToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers
                };

                const response = await fetch(url, {
                    ...options,
                    headers,
                    signal: controller.signal,
                    credentials: 'same-origin',
                    mode: 'cors',
                    cache: 'no-store'
                });

                clearTimeout(timeoutId);
                this.validateResponseHeaders(response);

                return response;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - please try again');
                }

                throw error;
            }
        }

        validateResponseHeaders(response) {
            const securityHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'Strict-Transport-Security'
            ];

            const config = window.SITE_CONFIG || {};
            if (config.enableLogging) {
                securityHeaders.forEach(header => {
                    if (!response.headers.get(header)) {
                        console.warn(`Missing security header: ${header}`);
                    }
                });
            }
        }

        async post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }

    // =========================================================
    // Loader Functions
    // =========================================================
    const showLoader = () => {
        const loaderHTML = `
            <div class="creative-loader-overlay" id="creativeLoader">
                <div class="loader-content">
                    <div class="loader-animation">
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                        <div class="loader-pulse"></div>
                    </div>
                    <p class="loader-text">Sending your message...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loaderHTML);

        setTimeout(() => {
            document.getElementById('creativeLoader')?.classList.add('active');
        }, 10);
    };

    const hideLoader = () => {
        const loader = document.getElementById('creativeLoader');
        if (loader) {
            loader.classList.remove('active');
            setTimeout(() => {
                loader.remove();
            }, 300);
        }
    };

    // =========================================================
    // Initialize on DOM Ready
    // =========================================================
    document.addEventListener("DOMContentLoaded", function () {
        const form = document.getElementById("contactForm");
        const submitBtn = document.getElementById("submitBtn");

        if (!form || !submitBtn) {
            console.error('Contact form elements not found');
            return;
        }

        // Initialize CSRF protection
        CSRFProtection.setToken();


        // Initialize rate limiter
        const config = window.SITE_CONFIG || {};
        const rateLimiter = new RateLimiter(
            config.rateLimitAttempts || 3,
            config.rateLimitWindow || 900000
        );


        // Initialize API client
        const apiClient = new SecureAPIClient(config.apiUrl);

        // Track form load time (bot detection)
        const formLoadTime = Date.now();

        // =========================================================
        // Form Submission Handler
        // =========================================================
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            // Bot detection - check submission time
            const submissionTime = Date.now();
            const timeDiff = submissionTime - formLoadTime;

            if (timeDiff < 2000) {
                SecurityMonitor.trackSuspiciousActivity('fast_submission', { timeDiff });
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Please take your time to fill out the form.",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Bot detection - honeypot check
            const honeypot = document.getElementById("website")?.value;
            if (honeypot) {
                SecurityMonitor.trackSuspiciousActivity('bot_detected');
                return; // Silent fail for bots
            }

            // Rate limiting check
            const limitCheck = rateLimiter.canSubmit();
            if (!limitCheck.allowed) {
                SecurityMonitor.trackSuspiciousActivity('rate_limit_exceeded');
                Swal.fire({
                    icon: "warning",
                    title: "Too Many Attempts",
                    text: limitCheck.message,
                    confirmButtonColor: "#f59e0b",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Collect and sanitize form values
            const rawName = document.getElementById("name").value.trim();
            const rawEmail = document.getElementById("email").value.trim();
            const rawMobile = document.getElementById("mobile").value.trim();
            const rawSubject = document.getElementById("subject").value.trim();
            const rawMessage = document.getElementById("message").value.trim();

            const name = InputValidator.sanitizeInput(rawName);
            const email = rawEmail;
            const mobile = InputValidator.sanitizeInput(rawMobile);
            const subject = InputValidator.sanitizeInput(rawSubject);
            const message = InputValidator.sanitizeInput(rawMessage);

            // Validation checks
            if (!name || !email || !mobile || !message || !subject) {
                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text: "Please fill in all fields before submitting.",
                    confirmButtonColor: "#6366f1",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Validate name
            if (!InputValidator.validateName(name)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Name",
                    text: "Please enter a valid name (2-100 characters, letters only).",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Validate email
            if (!InputValidator.validateEmail(email)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Email",
                    text: "Please enter a valid email address.",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Validate phone
            if (!InputValidator.validatePhone(mobile)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Phone Number",
                    text: "Please enter a valid phone number (8-15 digits).",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Validate subject
            if (!InputValidator.validateSubject(subject)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Subject",
                    text: "Subject must be between 3-200 characters.",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Validate message
            if (!InputValidator.validateMessage(message)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Message",
                    text: "Message must be between 10-5000 characters and not spam-like.",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Check for potential XSS attempts
            if (rawMessage.includes('<script>') || rawMessage.includes('javascript:')) {
                SecurityMonitor.trackSuspiciousActivity('xss_attempt', {
                    input: rawMessage.substring(0, 100)
                });
                Swal.fire({
                    icon: "error",
                    title: "Invalid Input",
                    text: "Your message contains invalid characters.",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
                return;
            }

            // Disable button and show loader
            submitBtn.disabled = true;
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

            showLoader();

            // Record attempt before API call
            rateLimiter.recordAttempt();

            try {


                const response = await apiClient.post('/contact-us', {
                    name,
                    email,
                    mobile,
                    subject,
                    message
                });

                hideLoader();

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Message Sent!",
                        html: `Thank you <strong>${InputValidator.sanitizeHTML(name)}</strong> for reaching out.<br>I will get back to you very soon.`,
                        confirmButtonColor: "#22c55e",
                        customClass: { popup: 'swal-modern' }
                    });

                    form.reset();
                    rateLimiter.reset(); // Reset on success

                } else {
                    let errorMessage = "Something went wrong. Please try again.";

                    try {
                        const errorData = await response.json();

                        if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
                            errorMessage = errorData.errors
                                .map(e => InputValidator.sanitizeHTML(e.description))
                                .join("\n");
                        } else if (errorData?.message) {
                            errorMessage = InputValidator.sanitizeHTML(errorData.message);
                        } else if (errorData?.detail) {
                            errorMessage = InputValidator.sanitizeHTML(errorData.detail);
                        }
                    } catch { }

                    Swal.fire({
                        icon: "error",
                        title: "Submission Failed",
                        text: errorMessage,
                        confirmButtonColor: "#ef4444",
                        customClass: { popup: 'swal-modern' }
                    });
                }
            } catch (error) {
                hideLoader();

                const errorMessage = SecureErrorHandler.handle(error, 'network');

                Swal.fire({
                    icon: "error",
                    title: "Network Error",
                    text: errorMessage,
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: 'swal-modern' }
                });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });

        // Real-time validation on blur
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                const value = this.value.trim();

                if (!value && this.hasAttribute('required')) {
                    this.classList.add('is-invalid');
                    return;
                }

                switch (this.id) {
                    case 'name':
                        this.classList.toggle('is-invalid', !InputValidator.validateName(value));
                        break;
                    case 'email':
                        this.classList.toggle('is-invalid', !InputValidator.validateEmail(value));
                        break;
                    case 'mobile':
                        this.classList.toggle('is-invalid', !InputValidator.validatePhone(value));
                        break;
                    case 'subject':
                        this.classList.toggle('is-invalid', !InputValidator.validateSubject(value));
                        break;
                    case 'message':
                        this.classList.toggle('is-invalid', !InputValidator.validateMessage(value));
                        break;
                }

                if (!this.classList.contains('is-invalid') && value) {
                    this.classList.add('is-valid');
                }
            });

            input.addEventListener('input', function () {
                this.classList.remove('is-invalid', 'is-valid');
            });
        });
    });

    // Clear sensitive data on page unload
    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('csrf_token');
    });

})();