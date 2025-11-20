// Utiliser les variables globales déclarées dans app.js
// Ces variables sont déjà définies dans app.js
// On les utilise sans les redéclarer

// Fonction pour initialiser l'application après l'onboarding
// Cette fonction est définie ici pour être utilisée dans ce fichier
function initializeApp() {
    console.log('Initialisation de l\'application depuis onboarding.js');
    
    // Initialiser l'interface utilisateur
    if (window.appContainer) {
        window.appContainer.style.opacity = '1';
    }
}

// Gestionnaire d'événements pour le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'onboarding a déjà été affiché
    window.hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const onboarding = document.getElementById('onboarding');
    window.appContainer = document.getElementById('app');
    
    if (hasSeenOnboarding === 'true' && onboarding && appContainer) {
        onboarding.style.display = 'none';
        appContainer.style.display = 'flex';
        initializeApp();
    } else if (onboarding) {
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
                
                // Forcer le navigateur à recalculer les styles
                if (indicators.length > 0) {
                    void indicators[0].offsetWidth;
                }
            }
            
            // Configuration des écouteurs d'événements
            function setupEventListeners() {
                console.log('Configuration des écouteurs d\'événements...');
                
                // Bouton Passer
                if (skipBtn) {
                    console.log('Ajout de l\'écouteur sur le bouton Passer');
                    skipBtn.addEventListener('click', handleSkip);
                } else {
                    console.error('Le bouton Passer n\'a pas été trouvé dans le DOM');
                }
                
                // Bouton Commencer
                if (startBtn) {
                    console.log('Ajout de l\'écouteur sur le bouton Commencer');
                    startBtn.addEventListener('click', handleStart);
                } else {
                    console.error('Le bouton Commencer n\'a pas été trouvé dans le DOM');
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
                
                if (!onboarding) return;
                
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
                console.log('%c=== DÉBUT handleSkip ===', 'color: #4CAF50; font-weight: bold;');
                console.log('1. Événement de clic détecté sur le bouton Passer');
                
                if (e) {
                    e.preventDefault();
                    console.log('2. Événement par défaut empêché');
                }
                
                console.log('3. Vérification des éléments DOM :');
                console.log('- Bouton Passer:', document.getElementById('skipOnboarding'));
                console.log('- Conteneur onboarding:', document.getElementById('onboarding'));
                
                // Forcer la mise à jour du localStorage
                window.localStorage.setItem('hasSeenOnboarding', 'true');
                console.log('4. localStorage mis à jour: hasSeenOnboarding =', window.localStorage.getItem('hasSeenOnboarding'));
                
                // Forcer le rechargement complet de la page
                console.log('5. Redirection forcée vers index.html avec rechargement');
                
                // Utiliser replace() pour éviter d'ajouter une entrée dans l'historique
                window.location.replace('index.html');
                
                // Au cas où la redirection échoue, forcer un rechargement
                setTimeout(() => {
                    console.log('6. Tentative de rechargement forcé...');
                    window.location.href = 'index.html';
                }, 100);
                
                console.log('%c=== FIN handleSkip ===', 'color: #4CAF50; font-weight: bold;');
            }
            
            // Gestionnaire pour le bouton Commencer
            function handleStart(e) {
                console.log('%c=== DÉBUT handleStart ===', 'color: #2196F3; font-weight: bold;');
                console.log('1. Événement de clic détecté sur le bouton Commencer');
                
                if (e) {
                    e.preventDefault();
                    console.log('2. Événement par défaut empêché');
                }
                
                console.log('3. Vérification des éléments DOM :');
                console.log('   - Bouton Commencer:', document.getElementById('startApp'));
                console.log('   - Conteneur onboarding:', document.getElementById('onboarding'));
                
                // Forcer la mise à jour du localStorage
                window.localStorage.setItem('hasSeenOnboarding', 'true');
                console.log('4. localStorage mis à jour: hasSeenOnboarding =', window.localStorage.getItem('hasSeenOnboarding'));
                
                // Forcer le rechargement complet de la page
                console.log('5. Redirection forcée vers index.html avec rechargement');
                
                // Afficher l'état actuel avant redirection
                console.log('6. État actuel avant redirection :', {
                    location: window.location.href,
                    localStorage: {
                        hasSeenOnboarding: localStorage.getItem('hasSeenOnboarding')
                    }
                });
                
                // Utiliser replace() pour éviter d'ajouter une entrée dans l'historique
                window.location.replace('index.html');
                
                // Au cas où la redirection échoue, forcer un rechargement
                setTimeout(() => {
                    console.log('7. Tentative de rechargement forcé...');
                    window.location.href = 'index.html';
                    window.location.reload(true);
                }, 100);
                
                console.log('%c=== FIN handleStart ===', 'color: #2196F3; font-weight: bold;');
            }
            
            // Terminer l'onboarding
            function finishOnboarding() {
                const onboarding = document.getElementById('onboarding');
                
                if (!onboarding) {
                    console.error('Élément onboarding non trouvé');
                    return;
                }
                
                // S'assurer que appContainer est défini
                const appContainer = document.getElementById('app');
                
                if (!appContainer) {
                    console.error('Élément app non trouvé');
                    return;
                }
                
                // Animation de fondu
                onboarding.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                onboarding.style.opacity = '0';
                onboarding.style.transform = 'scale(0.95)';
                
                // Après l'animation
                setTimeout(() => {
                    // Gestionnaire pour le bouton Passer
                    function handleSkip(e) {
                        console.log('1. Événement de clic détecté sur le bouton Passer');
                        
                        if (e) {
                            e.preventDefault();
                            console.log('2. Événement par défaut empêché');
                        }
                        
                        console.log('3. Vérification des éléments DOM :');
                        console.log('- Bouton Passer:', document.getElementById('skipOnboarding'));
                        console.log('- Conteneur onboarding:', document.getElementById('onboarding'));
                        
                        // Forcer la mise à jour du localStorage
                        window.localStorage.setItem('hasSeenOnboarding', 'true');
                        console.log('4. localStorage mis à jour: hasSeenOnboarding =', window.localStorage.getItem('hasSeenOnboarding'));
                        
                        // Forcer le rechargement complet de la page
                        console.log('5. Redirection forcée vers index.html avec rechargement');
                        window.location.replace('index.html');
                        
                        // Au cas où la redirection échoue, forcer un rechargement
                        setTimeout(() => {
                            console.log('6. Tentative de rechargement forcé...');
                            window.location.href = 'index.html';
                            window.location.reload(true);
                        }, 100);
                    }
                    
                    // Masquer l'onboarding et afficher l'application
                    onboarding.style.display = 'none';
                    appContainer.style.display = 'flex';
                    
                    // Initialiser l'application
                    try {
                        initializeApp();
                    } catch (error) {
                        console.error('Erreur lors de l\'initialisation de l\'application:', error);
                    }
                }, 500);
            }
            
            // Initialisation
            init();
            setupEventListeners();
        }
        
        // Démarrer l'onboarding
        initOnboarding();
    }
});
