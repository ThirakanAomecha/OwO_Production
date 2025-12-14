document.addEventListener('DOMContentLoaded', function() {
    // --- Existing JS for smooth scrolling and animations ---

    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    const header = document.getElementById('main-header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
        } else {
            header.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
        }
    });

    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.1, rootMargin: "0px" });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // --- Firebase Authentication & Firestore Logic ---

    try {
        const auth = firebase.auth();
        const db = firebase.firestore(); // Initialize Firestore
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        const githubProvider = new firebase.auth.GithubAuthProvider();

        const loginBtn = document.getElementById('login-btn');
        const githubLoginBtn = document.getElementById('github-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userProfileNav = document.getElementById('user-profile');
        const userPfpNav = document.getElementById('user-pfp');
        const dropdownMenu = document.getElementById('dropdown-menu');

        // Dropdown Menu Buttons
        const scoresBtn = document.getElementById('scores-btn');
        const donationsBtn = document.getElementById('donations-btn');
        const settingsBtn = document.getElementById('settings-btn');

        // Toggle dropdown menu
        userPfpNav.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown if clicked outside
        window.addEventListener('click', (e) => {
            if (!e.target.matches('#user-pfp')) {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });

        // Placeholder actions for new menu items
        scoresBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Score history page coming soon!'); });
        donationsBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Donation history page coming soon!'); });
        settingsBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Settings page coming soon!'); });

        // Login with Google
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signInWithPopup(googleProvider).catch(error => {
                console.error("Error during Google sign-in:", error);
            });
        });

        // Login with GitHub
        githubLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signInWithPopup(githubProvider).catch(error => {
                console.error("Error during GitHub sign-in:", error);
            });
        });

        // Logout
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().catch(error => {
                console.error("Error during sign-out:", error);
            });
        });

        // Auth state observer
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                loginBtn.style.display = 'none';
                githubLoginBtn.style.display = 'none'; // Hide GitHub login button too
                userProfileNav.style.display = 'flex'; // Correct display property
                
                const photoURL = user.photoURL ? user.photoURL.replace('s96-c', 's400-c') : 'https://via.placeholder.com/200';
                userPfpNav.src = photoURL;
            } else {
                // User is signed out
                loginBtn.style.display = 'list-item';
                githubLoginBtn.style.display = 'list-item'; // Show GitHub login button
                userProfileNav.style.display = 'none';
                userPfpNav.src = '';
            }
        });

    } catch (e) {
        console.error('Firebase initialization error:', e);
    }
});