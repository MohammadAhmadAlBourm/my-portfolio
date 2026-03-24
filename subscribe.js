// =========================================================
// NEWSLETTER SUBSCRIPTION WITH CREATIVE LOADER
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newsletterForm");
    const emailInput = document.getElementById("newsletterEmail");

    // =========================================================
    // Creative Loader Functions
    // =========================================================

    const showLoader = () => {
        // Create loader overlay
        const loaderHTML = `
            <div class="creative-loader-overlay" id="creativeLoader">
                <div class="loader-content">
                    <div class="loader-animation">
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                        <div class="loader-pulse"></div>
                    </div>
                    <p class="loader-text">Subscribing...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loaderHTML);

        // Trigger animation
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
    // Form Submission Handler
    // =========================================================

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Validation
        if (!email) {
            Swal.fire({
                icon: "warning",
                title: "Oops!",
                text: "Please enter a valid email address.",
                confirmButtonColor: "#6366f1",
                customClass: {
                    popup: 'swal-modern'
                }
            });
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: "warning",
                title: "Invalid Email",
                text: "Please enter a valid email format.",
                confirmButtonColor: "#6366f1",
                customClass: {
                    popup: 'swal-modern'
                }
            });
            return;
        }

        // Show loader
        showLoader();

        try {
            const response = await fetch("https://localhost:7011/api/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            // Hide loader
            hideLoader();

            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Subscribed!",
                    text: "Thank you for subscribing to our newsletter.",
                    confirmButtonColor: "#6366f1",
                    customClass: {
                        popup: 'swal-modern'
                    }
                });
                emailInput.value = "";
            } else {
                let errorMessage = "Something went wrong. Please try again.";

                try {
                    const errorData = await response.json();

                    // Case 1: Validation errors
                    if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
                        errorMessage = errorData.errors
                            .map(e => e.description)
                            .join("\n");
                    }
                    // Case 2: General/system error
                    else if (errorData?.message) {
                        errorMessage = errorData.message;
                    }
                    // Case 3: RFC problem-details detail
                    else if (errorData?.detail) {
                        errorMessage = errorData.detail;
                    }
                } catch {
                    // JSON parsing failed → keep default message
                }

                Swal.fire({
                    icon: "error",
                    title: "Subscription Failed",
                    text: errorMessage,
                    confirmButtonColor: "#ef4444",
                    customClass: {
                        popup: 'swal-modern'
                    }
                });
                emailInput.value = "";
            }
        } catch (error) {
            // Hide loader on error
            hideLoader();

            console.error("Error subscribing:", error);
            Swal.fire({
                icon: "error",
                title: "Connection Error",
                text: "An error occurred. Please check your connection and try again.",
                confirmButtonColor: "#ef4444",
                customClass: {
                    popup: 'swal-modern'
                }
            });
            emailInput.value = "";
        }
    });
});