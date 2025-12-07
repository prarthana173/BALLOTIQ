document.addEventListener('DOMContentLoaded', () => {
    console.log('BallotIQ Voting System Initialized');

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Navigation Toggle
    const burger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    if (burger) {
        burger.addEventListener('click', () => {
            // Toggle Nav
            nav.classList.toggle('nav-active');

            // Burger Animation
            burger.classList.toggle('active');

            // Animate Links
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
        });
    }

    // User Access Modal Logic
    const modal = document.getElementById('user-access-modal');
    const modalClose = document.querySelector('.modal-close');
    const btnBackHome = document.querySelector('.btn-back-home');
    const ctaBtns = document.querySelectorAll('.btn-primary'); // Select all Get Started buttons

    if (modal) {
        // Open Modal
        ctaBtns.forEach(btn => {
            // Only trigger for Get Started buttons (not the form submit or Register Now in modal)
            if (btn.textContent.includes('Get Started')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('active');
                });
            }
        });

        // Close Modal Actions
        const closeModal = () => modal.classList.remove('active');

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (btnBackHome) btnBackHome.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-show');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.scroll-hidden');
    hiddenElements.forEach((el) => observer.observe(el));
});
