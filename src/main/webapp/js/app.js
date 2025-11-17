// Gestionnaire d'événements pour le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'onboarding a déjà été affiché
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const onboarding = document.getElementById('onboarding');
    const appContainer = document.getElementById('appContainer');
    
    // Si l'utilisateur a déjà vu l'onboarding, passer directement à l'application
    if (hasSeenOnboarding === 'true') {
        onboarding.style.display = 'none';
        appContainer.style.display = 'flex';
        initializeApp();
        return;
    }
    
    // Initialiser l'onboarding
    initOnboarding();
    
    // Fonction pour initialiser l'application après l'onboarding
    function initializeApp() {
    // Éléments du DOM
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.getElementById('mainContent');
    
    // Pages disponibles
    const pages = {
        home: `
            <div class="welcome-message fade-in">
                <h2>Bienvenue sur LoveMatch</h2>
                <p>Découvrez des personnes incroyables autour de vous !</p>
                <div class="card" style="margin-top: 2rem;">
                    <img src="https://via.placeholder.com/400x300" alt="Découverte" class="card-img">
                    <div class="card-content">
                        <h3>Commencez à matcher</h3>
                        <p>Swipez à droite pour aimer, à gauche pour passer</p>
                    </div>
                </div>
            </div>
        `,
        discover: `
            <div class="discover-container fade-in">
                <h2>Découverte</h2>
                <div class="profile-card">
                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profil" class="profile-img">
                    <h3>Sophie, 28</h3>
                    <p>Paris, France</p>
                    <div class="profile-actions">
                        <button class="btn btn-dislike"><i class="fas fa-times"></i></button>
                        <button class="btn btn-like"><i class="fas fa-heart"></i></button>
                    </div>
                </div>
            </div>
        `,
        messages: `
            <div class="messages-container fade-in">
                <h2>Messages</h2>
                <div class="conversation-list">
                    <div class="conversation">
                        <img src="https://randomuser.me/api/portraits/women/33.jpg" alt="Profil" class="conversation-avatar">
                        <div class="conversation-details">
                            <h4>Marie</h4>
                            <p>Salut ! Comment ça va ?</p>
                        </div>
                        <span class="message-time">12:30</span>
                    </div>
                    <div class="conversation">
                        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profil" class="conversation-avatar">
                        <div class="conversation-details">
                            <h4>Thomas</h4>
                            <p>On se voit ce soir ?</p>
                        </div>
                        <span class="message-time">10:15</span>
                    </div>
                </div>
            </div>
        `,
        profile: `
            <div class="profile-container fade-in">
                <div class="profile-header">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="Votre photo de profil" class="profile-picture">
                    <h2>Votre Nom</h2>
                    <p>Paris, France</p>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-edit">Modifier le profil</button>
                    <button class="btn btn-settings">Paramètres</button>
                </div>
                <div class="profile-details">
                    <h3>À propos de moi</h3>
                    <p>Passionné de voyages, de cuisine et de photographie. Je cherche quelqu'un pour partager de bons moments !</p>
                </div>
            </div>
        `
    };

    // Gestionnaire de clic pour la navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Retirer la classe active de tous les éléments
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Ajouter la classe active à l'élément cliqué
            this.classList.add('active');
            
            // Récupérer la page à afficher
            const page = this.getAttribute('data-page');
            
            // Mettre à jour le contenu principal
            if (pages[page]) {
                mainContent.innerHTML = pages[page];
            }
            
            // Faire défiler vers le haut
            mainContent.scrollTop = 0;
        });
    });

        // Initialisation : charger la page d'accueil
        mainContent.innerHTML = pages.home;

        // Gestionnaire pour le bouton des paramètres
        document.getElementById('settingsBtn')?.addEventListener('click', function() {
        // Ici, vous pouvez ajouter la logique pour ouvrir les paramètres
        alert('Ouvrir les paramètres');
    });

        // Détection du mode sombre
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        }

        // Écouter les changements de thème
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
    }
    
    // Fonction pour initialiser l'onboarding
    function initOnboarding() {
        const skipBtn = document.getElementById('skipOnboarding');
        const startBtn = document.getElementById('startApp');
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');
        const slides = document.querySelectorAll('.onboarding-slide');
        const indicators = document.querySelectorAll('.indicator');
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
                    slide.style.transform = 'translateX(0)';
                    slide.style.pointerEvents = 'auto';
                }
            });
            
            // Mettre à jour l'état initial des indicateurs et de la navigation
            updateIndicators();
            updateNavigation();
        }
        
        // Mettre à jour les indicateurs
        function updateIndicators() {
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === currentSlide);
            });
            
            // Forcer le navigateur à recalculer les styles pour s'assurer que les changements sont visibles
            void indicators[0].offsetWidth;
        }
        
        // Gestionnaire pour le bouton Passer
        function setupEventListeners() {
            skipBtn.addEventListener('click', handleSkip);
            
            if (startBtn) {
                startBtn.addEventListener('click', handleStart);
            }
            
            if (prevBtn && nextBtn) {
                prevBtn.addEventListener('click', prevSlide);
                nextBtn.addEventListener('click', nextSlide);
            }
            
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => goToSlide(index));
            });
            
            document.addEventListener('keydown', handleKeyDown);
            setupSwipeGestures();
        }
        
        // Gestion du clavier
        function handleKeyDown(e) {
            if (isAnimating) return;
            
            switch(e.key) {
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
        
        // Configuration des gestes de balayage
        function setupSwipeGestures() {
            let touchStartX = 0;
            let touchEndX = 0;
            const swipeThreshold = 50;
            
            const onboarding = document.getElementById('onboarding');
            
            onboarding.addEventListener('touchstart', e => {
                if (isAnimating) return;
                touchStartX = e.changedTouches[0].clientX;
            }, { passive: true });
            
            onboarding.addEventListener('touchmove', e => {
                if (isAnimating) e.preventDefault();
            }, { passive: false });
            
            onboarding.addEventListener('touchend', e => {
                if (isAnimating) return;
                touchEndX = e.changedTouches[0].clientX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) < swipeThreshold) return;
                
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
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
            
            // Mettre à jour l'index de la slide courante
            currentSlide = newIndex;
            
            // Préparer la nouvelle slide
            newSlideElement.style.display = 'flex';
            newSlideElement.style.opacity = '0';
            newSlideElement.style.transform = direction === 'next' ? 'translateX(50px)' : 'translateX(-50px)';
            
            // Mettre à jour la navigation avant l'animation pour un retour visuel immédiat
            updateNavigation();
            updateIndicators();
            
            // Démarrer l'animation
            requestAnimationFrame(() => {
                // Masquer la slide actuelle
                currentSlideElement.style.opacity = '0';
                currentSlideElement.style.transform = direction === 'next' ? 'translateX(-50px)' : 'translateX(50px)';
                
                // Afficher la nouvelle slide
                newSlideElement.style.opacity = '1';
                newSlideElement.style.transform = 'translateX(0)';
                
                // Réinitialiser l'état d'animation
                setTimeout(() => {
                    currentSlideElement.style.display = 'none';
                    isAnimating = false;
                }, animationDuration);
            });
        }
        
        // Mettre à jour la navigation (flèches et boutons)
        function updateNavigation() {
            // Mettre à jour les flèches
            if (prevBtn) {
                const prevOpacity = currentSlide === 0 ? 0 : 1;
                prevBtn.style.transition = 'opacity 0.3s ease';
                prevBtn.style.opacity = prevOpacity;
                prevBtn.style.pointerEvents = prevOpacity === 0 ? 'none' : 'auto';
                
                // Forcer le navigateur à recalculer les styles
                void prevBtn.offsetWidth;
            }
            
            if (nextBtn) {
                const nextOpacity = currentSlide === slides.length - 1 ? 0 : 1;
                nextBtn.style.transition = 'opacity 0.3s ease';
                nextBtn.style.opacity = nextOpacity;
                nextBtn.style.pointerEvents = nextOpacity === 0 ? 'none' : 'auto';
                
                // Forcer le navigateur à recalculer les styles
                void nextBtn.offsetWidth;
            }
            
            // Mettre à jour le bouton Passer
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
            const onboarding = document.getElementById('onboarding');
            
            // Animation de fondu
            onboarding.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            onboarding.style.opacity = '0';
            onboarding.style.transform = 'scale(0.95)';
            
            // Après l'animation
            setTimeout(() => {
                // Enregistrer que l'utilisateur a vu l'onboarding
                localStorage.setItem('hasSeenOnboarding', 'true');
                
                // Masquer l'onboarding et afficher l'application
                onboarding.style.display = 'none';
                appContainer.style.display = 'flex';
                
                // Initialiser l'application
                initializeApp();
            }, 500);
        }
        
        // Initialisation
        init();
        setupEventListeners();
    }
});

// Gestion des WebSockets pour la messagerie en temps réel
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUri = protocol + window.location.host + '/lovematch/chat';
    
    try {
        const websocket = new WebSocket(wsUri);
        
        websocket.onopen = function(evt) {
            console.log('Connexion WebSocket établie');
        };
        
        websocket.onmessage = function(evt) {
            const message = JSON.parse(evt.data);
            console.log('Message reçu:', message);
            // Mettre à jour l'interface utilisateur avec le nouveau message
            updateMessageUI(message);
        };
        
        websocket.onerror = function(evt) {
            console.error('Erreur WebSocket:', evt);
        };
        
        return websocket;
    } catch (exception) {
        console.error('Erreur lors de l\'initialisation du WebSocket:', exception);
    }
}

// Mettre à jour l'interface utilisateur avec un nouveau message
function updateMessageUI(message) {
    // Implémentez la logique pour afficher le message dans l'interface
    console.log('Mise à jour de l\'interface avec le message:', message);
}

// Initialiser la connexion WebSocket lorsque l'utilisateur est connecté
// const socket = initWebSocket();

// Fonction pour envoyer un message via WebSocket
function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error('La connexion WebSocket n\'est pas établie');
    }
}
