// =========================================================
// MODERN PORTFOLIO - ENHANCED JAVASCRIPT
// =========================================================

(function () {
    'use strict';

    // =========================================================
    // Utility Functions
    // =========================================================

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // =========================================================
    // Navbar Scroll Effect
    // =========================================================

    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar?.offsetHeight || 0;

    const handleScroll = throttle(() => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);

    // =========================================================
    // Smooth Scroll for Navigation Links
    // =========================================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Skip if it's just "#" or empty
            if (!href || href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse?.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                        toggle: true
                    });
                }
            }
        });
    });

    // =========================================================
    // Scroll Reveal Animation
    // =========================================================

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optionally unobserve after animation
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with reveal class
    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    // =========================================================
    // Back to Top Button
    // =========================================================

    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        const toggleBackToTop = throttle(() => {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }, 100);

        window.addEventListener('scroll', toggleBackToTop);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =========================================================
    // Active Navigation Link
    // =========================================================

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const highlightNav = throttle(() => {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - navbarHeight - 50;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, 100);

    window.addEventListener('scroll', highlightNav);

    // =========================================================
    // Lazy Loading Images
    // =========================================================

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // =========================================================
    // Form Validation Enhancement
    // =========================================================

    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Add floating label effect
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement?.classList.remove('focused');
                }
            });

            // Real-time validation
            input.addEventListener('blur', () => {
                if (input.hasAttribute('required') && !input.value) {
                    input.classList.add('is-invalid');
                } else if (input.type === 'email' && input.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        input.classList.add('is-invalid');
                    } else {
                        input.classList.remove('is-invalid');
                    }
                } else {
                    input.classList.remove('is-invalid');
                }
            });
        });
    });

    // =========================================================
    // Performance: Preload Critical Resources
    // =========================================================

    const preloadLink = (href, as) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    };

    // =========================================================
    // Accessibility: Skip to Main Content
    // =========================================================

    const skipLink = document.createElement('a');
    skipLink.href = '#hero';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--primary);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 9999;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // =========================================================
    // Dark Mode Toggle (Optional Enhancement)
    // =========================================================

    // Uncomment to enable dark mode
    /*
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
    document.body.appendChild(darkModeToggle);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', isDark);
    };

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Check saved preference
    if (localStorage.getItem('darkMode') === 'true' || 
        (!localStorage.getItem('darkMode') && prefersDark.matches)) {
        document.body.classList.add('dark-mode');
    }
    */

    // =========================================================
    // Analytics: Track Button Clicks (Optional)
    // =========================================================

    const trackButtonClick = (buttonText, buttonHref) => {
        // Replace with your analytics tracking code
        console.log('Button clicked:', buttonText, buttonHref);

        // Example for Google Analytics 4
        // gtag('event', 'button_click', {
        //     'button_text': buttonText,
        //     'button_href': buttonHref
        // });
    };

    document.querySelectorAll('.btn, .project-link, .social-icon').forEach(button => {
        button.addEventListener('click', function () {
            const text = this.textContent.trim() || this.getAttribute('aria-label') || 'Unknown';
            const href = this.href || this.getAttribute('data-href') || '';
            trackButtonClick(text, href);
        });
    });

    // =========================================================
    // Console Art (Fun Easter Egg)
    // =========================================================

    console.log('%c💻 Mohammad Al Bourm Portfolio', 'color: #6366f1; font-size: 24px; font-weight: bold;');
    console.log('%cInterested in the code? Let\'s connect!', 'color: #475569; font-size: 14px;');
    console.log('%cEmail: mohammadbourm@gmail.com', 'color: #22c55e; font-size: 12px;');

    // =========================================================
    // Service Worker Registration (PWA - Optional)
    // =========================================================

    /*
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed'));
        });
    }
    */

    // =========================================================
    // Page Load Performance Logging
    // =========================================================

    window.addEventListener('load', () => {
        if (window.performance) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Page loaded in ${pageLoadTime}ms`);
        }
    });

    // =========================================================
    // Keyboard Navigation Enhancement
    // =========================================================

    document.addEventListener('keydown', (e) => {
        // Escape key closes mobile menu
        if (e.key === 'Escape') {
            const navbarCollapse = document.querySelector('.navbar-collapse.show');
            if (navbarCollapse) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        }
    });

    // =========================================================
    // Print Styles Trigger
    // =========================================================

    window.addEventListener('beforeprint', () => {
        document.body.classList.add('printing');
    });

    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    });

})();