// Déclarer les variables globales en les rattachant à window
if (!window.appContainer) window.appContainer = null;
if (!window.hasOwnProperty('hasSeenOnboarding')) window.hasSeenOnboarding = null;

// Fonction pour initialiser l'application après l'onboarding
function initializeApp() {
    console.log('Application initialisée');

    // Initialiser l'interface utilisateur
    if (window.appContainer) {
        // On s'assure que l'opacité est bien à 1 au cas où
        window.appContainer.style.opacity = '1';
    }

    // Initialiser la messagerie en temps réel
    initWebSocket();
}

// ==========================================================
// 1. GESTIONNAIRE D'ÉVÉNEMENTS PRINCIPAL (Nettoyé)
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM chargé, vérification de la page...');

    // 1a. Lancer la logique d'onboarding (la fonction gère si elle doit s'exécuter ou non)
    initOnboarding();

    // 1b. Vérifier si l'application principale doit être affichée (après onboarding)
    window.hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const onboarding = document.getElementById('onboarding');
    window.appContainer = document.getElementById('appContainer');

    if (window.hasSeenOnboarding === 'true' && onboarding && window.appContainer) {
        console.log('Onboarding déjà vu, affichage de l\'application');
        onboarding.style.display = 'none';
        window.appContainer.style.display = 'flex';
        initializeApp();
    }

    // Gestion des messages pour utilisateurs non connectés (Profil et Messages)
    const path = window.location.pathname;
    const token = localStorage.getItem('token');

    if (!token) {
        if (path.includes('profil.html')) {
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer) {
                profileContainer.innerHTML = '<div class="auth-message" style="text-align: center; margin-top: 50px; font-size: 1.2rem; color: #666;">pas connecter pas de profil veuiller vous connecter</div>';
            }
        } else if (path.includes('messages.html')) {
            const messagesContainer = document.querySelector('.messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '<div class="auth-message" style="text-align: center; margin-top: 50px; font-size: 1.2rem; color: #666;">pas connectyer et pas de match donc pas de message</div>';
            }
        }
    }

    // Mettre à jour l'interface d'authentification (Navbar)
    updateAuthUI();
});

// Fonction pour mettre à jour la navbar en fonction de l'état de connexion
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        // Utilisateur connecté
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';

        if (logoutBtn) {
            logoutBtn.style.display = 'inline-flex'; // Utiliser inline-flex pour garder l'alignement avec l'icône
            logoutBtn.onclick = function (e) {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.href = 'index.html';
            };
        }
    } else {
        // Utilisateur déconnecté
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (registerBtn) registerBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ==========================================================
// 2. FONCTIONS DE L'ONBOARDING (Sécurisées)
// ==========================================================

// Fonction pour initialiser l'onboarding
function initOnboarding() {
    const onboarding = document.getElementById('onboarding');

    // 👈 SÉCURITÉ : Si l'élément n'existe pas (sur les pages de connexion/inscription), on arrête.
    if (!onboarding) {
        // console.log("Élément d'onboarding non trouvé, c'est normal sur cette page.");
        return;
    }

    // Si l'utilisateur a déjà vu l'onboarding, on laisse le DOMContentLoaded gérer le reste.
    if (localStorage.getItem('hasSeenOnboarding') === 'true') {
        return;
    }

    console.log('Initialisation de l\'onboarding...');

    const skipBtn = document.getElementById('skipOnboarding');
    const startBtn = document.getElementById('startApp');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const slides = document.querySelectorAll('.onboarding-slide');
    const indicators = document.querySelectorAll('.indicator');

    // Variables locales pour la gestion des slides
    let currentSlide = 0;
    let isAnimating = false;
    const animationDuration = 500; // Durée de l'animation en ms

    // Initialisation
    function init() {
        // Masquer toutes les slides sauf la première
        slides.forEach((slide, index) => {
            slide.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            if (index !== 0) {
                slide.style.display = 'none';
                slide.style.opacity = '0';
                slide.style.pointerEvents = 'none';
            } else {
                slide.style.display = 'flex';
                slide.style.opacity = '1';
                slide.style.pointerEvents = 'auto';
            }
        });

        updateIndicators();
    }

    // Mettre à jour les indicateurs
    function updateIndicators() {
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentSlide);
        });
        updateNavigation();
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        if (skipBtn) {
            skipBtn.addEventListener('click', handleSkip);
        }
        if (startBtn) {
            startBtn.addEventListener('click', handleStart);
        }
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => goToSlide(index));
        });
        document.addEventListener('keydown', handleKeyDown);
    }

    // Gestionnaire d'événements clavier
    function handleKeyDown(e) {
        if (isAnimating) return;

        switch (e.key) {
            case 'ArrowRight':
                nextSlide();
                break;
            case 'ArrowLeft':
                prevSlide();
                break;
            case 'Escape':
                finishOnboarding();
                break;
        }
    }

    // Aller à une slide spécifique
    function goToSlide(index) {
        if (index === currentSlide || isAnimating || index < 0 || index >= slides.length) return;

        const direction = index > currentSlide ? 'next' : 'prev';
        animateTransition(currentSlide, index, direction);
    }

    // Animation de transition entre les slides
    function animateTransition(currentIndex, newIndex, direction) {
        isAnimating = true;
        const currentSlideElement = slides[currentIndex];
        const newSlideElement = slides[newIndex];
        currentSlide = newIndex;

        // Préparer la nouvelle slide
        newSlideElement.style.display = 'flex';
        newSlideElement.style.opacity = '0';
        newSlideElement.style.transform = direction === 'next' ? 'translateX(50px)' : 'translateX(-50px)';
        newSlideElement.style.pointerEvents = 'auto';

        updateNavigation();
        updateIndicators();

        requestAnimationFrame(() => {
            // Masquer la slide actuelle
            currentSlideElement.style.opacity = '0';
            currentSlideElement.style.transform = direction === 'next' ? 'translateX(-50px)' : 'translateX(50px)';
            currentSlideElement.style.pointerEvents = 'none';

            // Afficher la nouvelle slide
            newSlideElement.style.opacity = '1';
            newSlideElement.style.transform = 'translateX(0)';

            setTimeout(() => {
                currentSlideElement.style.display = 'none';
                isAnimating = false;
            }, animationDuration);
        });
    }

    // Mettre à jour la navigation
    function updateNavigation() {
        if (prevBtn) {
            const prevOpacity = currentSlide === 0 ? 0 : 1;
            prevBtn.style.opacity = prevOpacity;
            prevBtn.style.pointerEvents = prevOpacity === 0 ? 'none' : 'auto';
        }
        if (nextBtn) {
            const nextOpacity = currentSlide === slides.length - 1 ? 0 : 1;
            nextBtn.style.opacity = nextOpacity;
            nextBtn.style.pointerEvents = nextOpacity === 0 ? 'none' : 'auto';
        }
        if (skipBtn) {
            skipBtn.style.display = currentSlide === slides.length - 1 ? 'none' : 'flex';
        }
    }

    // Passer à la slide suivante
    function nextSlide() {
        if (currentSlide < slides.length - 1 && !isAnimating) {
            goToSlide(currentSlide + 1);
        }
    }

    // Revenir à la slide précédente
    function prevSlide() {
        if (currentSlide > 0 && !isAnimating) {
            goToSlide(currentSlide - 1);
        }
    }

    // Gestionnaire pour le bouton Passer
    function handleSkip(e) {
        e.preventDefault();
        finishOnboarding();
    }

    // Gestionnaire pour le bouton Commencer
    function handleStart(e) {
        e.preventDefault();
        finishOnboarding();
    }

    // Terminer l'onboarding
    function finishOnboarding() {
        localStorage.setItem('hasSeenOnboarding', 'true');

        const onboarding = document.getElementById('onboarding');
        const appContainer = document.getElementById('appContainer');

        if (onboarding && appContainer) {
            onboarding.style.transition = 'opacity 0.5s ease';
            onboarding.style.opacity = '0';

            setTimeout(() => {
                onboarding.style.display = 'none';
                appContainer.style.display = 'flex';
                initializeApp();
            }, 500);
        } else {
            console.error('Éléments non trouvés pour la transition, rechargement...');
            window.location.href = 'index.html';
        }
    }

    // Initialisation
    init();
    setupEventListeners();
}

// ==========================================================
// 3. FONCTIONS GLOBALES (WebSockets)
// ==========================================================

// Gestion des WebSockets pour la messagerie en temps réel
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(protocol + window.location.host + '/ws');

    ws.onopen = function () {
        console.log('Connexion WebSocket établie');
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        console.log('Message reçu:', message);
        // Traiter le message reçu
    };

    ws.onclose = function () {
        console.log('Connexion WebSocket fermée');
        // Tentative de reconnexion après 5 secondes
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = function (error) {
        console.error('Erreur WebSocket:', error);
    };

    return ws;
}