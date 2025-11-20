// Log de démarrage du script
console.log('[Discovery] Initialisation du module de découverte');

document.addEventListener('DOMContentLoaded', function () {
    console.log('[Discovery] DOM chargé, initialisation...');

    const profilesContainer = document.getElementById('profiles-container');
    if (!profilesContainer) {
        console.error('[Discovery] Élément profiles-container non trouvé dans le DOM');
        return;
    }

    const isLoggedIn = !!localStorage.getItem('token');
    console.log(`[Discovery] Utilisateur ${isLoggedIn ? 'connecté' : 'non connecté'}`);

    // Mettre à jour l'interface en fonction de l'état de connexion
    updateUIForAuthState(isLoggedIn);

    // Charger les profils
    console.log('[Discovery] Début du chargement des profils...');
    let allProfiles = []; // Stocker tous les profils pour le filtrage
    loadProfiles();

    // Gestion des filtres
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', filterProfiles);
    }

    function filterProfiles() {
        console.log('[Discovery] Application des filtres');

        const ageMin = parseInt(document.getElementById('age-min').value) || 18;
        const ageMax = parseInt(document.getElementById('age-max').value) || 100;

        const genderInput = document.querySelector('input[name="gender"]:checked');
        const gender = genderInput ? genderInput.value : 'all';

        const interest = document.getElementById('interest-filter').value.toLowerCase();
        const city = document.getElementById('city').value.toLowerCase().trim();

        console.log(`Filtres: Age ${ageMin}-${ageMax}, Genre: ${gender}, Intérêt: ${interest}, Ville: ${city}`);

        const filtered = allProfiles.filter(profile => {
            // Filtre Age
            const age = profile.age || 0;
            if (age < ageMin || age > ageMax) return false;

            // Filtre Genre
            if (gender !== 'all') {
                const profileGender = (profile.gender || '').toLowerCase();
                // Normalisation pour correspondre aux valeurs 'male'/'female'
                const normalizedGender = gender === 'male' ? 'male' : 'female';
                // Vérifier si le genre correspond (en gérant les cas 'Homme'/'Femme' vs 'MALE'/'FEMALE')
                const isMale = profileGender === 'male' || profileGender === 'homme' || profileGender === 'm';
                const isFemale = profileGender === 'female' || profileGender === 'femme' || profileGender === 'f';

                if (normalizedGender === 'male' && !isMale) return false;
                if (normalizedGender === 'female' && !isFemale) return false;
            }

            // Filtre Ville
            if (city && (!profile.city || !profile.city.toLowerCase().includes(city))) {
                return false;
            }

            // Filtre Intérêt
            if (interest) {
                const interests = profile.interests || [];
                // Vérifier si l'un des intérêts contient le terme recherché
                const hasInterest = interests.some(i => i.toLowerCase().includes(interest));
                if (!hasInterest) return false;
            }

            return true;
        });

        console.log(`[Discovery] ${filtered.length} profils après filtrage`);
        displayProfiles(filtered);

        if (filtered.length === 0) {
            profilesContainer.innerHTML = `
                <div class="no-profiles">
                    <h3>Aucun profil ne correspond à vos critères</h3>
                    <p>Essayez d'élargir votre recherche.</p>
                </div>
            `;
        }
    }

    // Gestion des événements de bouton
    document.addEventListener('click', function (e) {
        if (e.target.closest('.like-btn')) {
            const card = e.target.closest('.profile-card');
            if (!isLoggedIn) {
                showLoginRequired();
                return;
            }
            handleAction(card.dataset.userId, 'like');
        } else if (e.target.closest('.view-profile-btn')) {
            const card = e.target.closest('.profile-card');
            viewProfile(card.dataset.userId);
        }
    });

    // Fonction pour charger les profils
    async function loadProfiles() {
        try {
            console.log('Chargement des profils...');

            // Récupérer l'ID de l'utilisateur connecté (peut être null)
            const currentUserId = localStorage.getItem('userId');
            console.log(`[Discovery] ID utilisateur actuel: ${currentUserId || 'Non connecté'}`);

            let apiUrl;

            if (currentUserId) {
                // Utilisateur connecté : récupérer les matchs potentiels
                apiUrl = `/api/profiles/matches/${currentUserId}?gender=${getSearchPreference()}`;
            } else {
                // Utilisateur non connecté : récupérer tous les profils
                apiUrl = '/api/profiles';
            }

            // Récupérer les profils depuis l'API
            console.log(`[Discovery] Appel API: ${apiUrl}`);

            // Récupérer le token d'authentification
            const token = localStorage.getItem('token');
            console.log(`[Discovery] Token présent: ${!!token}`);

            const headers = {
                'Accept': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('[Discovery] Ajout du header Authorization');
            } else {
                console.log('[Discovery] Aucun token, requête anonyme');
            }

            console.log(`[Discovery] Envoi de la requête fetch vers ${apiUrl}`);
            const response = await fetch(apiUrl, {
                headers: headers
            });
            console.log(`[Discovery] Réponse reçue. Status: ${response.status}`);

            // Vérifier le type de contenu de la réponse
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('[Discovery] Réponse non-JSON reçue, utilisation des données de test (mock)');
                displayProfiles(getMockProfiles());
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                console.error('[Discovery] Erreur API:', data);
                throw new Error(data.message || 'Erreur lors du chargement des profils');
            }

            const profiles = Array.isArray(data) ? data : [];
            // Mélanger les profils pour un affichage aléatoire
            allProfiles = shuffleArray(profiles);
            console.log(`[Discovery] ${profiles.length} profils récupérés et mélangés`);

            if (profiles.length === 0) {
                console.log('[Discovery] Aucun profil trouvé');
                showNoProfilesMessage();
                return;
            }

            displayProfiles(profiles);

            // Code original commenté pour référence
            /*
            const response = await fetch('/api/profiles');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des profils');
            }
            const profiles = await response.json();
            console.log('Profils chargés:', profiles);
            
            if (profiles.length === 0) {
                showNoProfilesMessage();
                return;
            }
            
            displayProfiles(profiles);
            */
        } catch (error) {
            console.error('Erreur API, passage en mode démo:', error);
            console.log('[Discovery] Affichage des profils de test');
            displayProfiles(getMockProfiles());
        }
    }

    // Fonction pour obtenir des profils de test (mock)
    function getMockProfiles() {
        console.log('[Discovery] Génération de profils de test (mock)');
        return [
            {
                id: 'mock1',
                name: 'Alice',
                age: 28,
                location: 'Paris',
                photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
                profilePictureUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
            },
            {
                id: 'mock2',
                name: 'Bob',
                age: 32,
                location: 'Lyon',
                photoUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
                profilePictureUrl: 'https://randomuser.me/api/portraits/men/2.jpg'
            },
            {
                id: 'mock3',
                name: 'Charlie',
                age: 25,
                location: 'Marseille',
                photoUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
                profilePictureUrl: 'https://randomuser.me/api/portraits/women/3.jpg'
            },
            {
                id: 'mock4',
                name: 'Diana',
                age: 30,
                location: 'Bordeaux',
                photoUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
                profilePictureUrl: 'https://randomuser.me/api/portraits/men/4.jpg'
            }
        ];
    }

    // Variables pour la pagination
    let currentDisplayedProfiles = [];
    let displayedCount = 0;
    const BATCH_SIZE = 9;
    let observer = null;

    // Afficher les profils (avec pagination par remplacement)
    function displayProfiles(profiles) {
        console.log(`[Discovery] Initialisation de l'affichage pour ${profiles.length} profils`);

        currentDisplayedProfiles = profiles;
        displayedCount = 0; // Index de départ

        if (!Array.isArray(profiles)) {
            console.error('[Discovery] Erreur: les profils ne sont pas un tableau', profiles);
            return;
        }

        if (profiles.length === 0) {
            profilesContainer.innerHTML = ''; // Effacer le contenu précédent
            return; // Le message "Aucun profil" est géré par l'appelant
        }

        // Afficher le premier lot
        showBatch(0);
    }

    // Afficher un lot spécifique de profils
    function showBatch(startIndex) {
        // Validation de l'index
        if (startIndex < 0) startIndex = 0;
        if (startIndex >= currentDisplayedProfiles.length) return;

        const endIndex = Math.min(startIndex + BATCH_SIZE, currentDisplayedProfiles.length);
        const batch = currentDisplayedProfiles.slice(startIndex, endIndex);

        console.log(`[Discovery] Affichage du lot : ${startIndex} à ${endIndex}`);

        // Vider le conteneur pour REMPLACER les profils
        profilesContainer.innerHTML = '';

        // Ajouter les cartes de profil
        batch.forEach((profile) => {
            try {
                const profileCard = createProfileCard(profile);
                if (profileCard) {
                    profilesContainer.appendChild(profileCard);
                }
            } catch (error) {
                console.error(`[Discovery] Erreur lors de la création de la carte`, error);
            }
        });

        // Mettre à jour l'index courant
        displayedCount = startIndex;

        // Ajouter les boutons de navigation
        createNavigationButtons(startIndex, endIndex, currentDisplayedProfiles.length);
    }

    // Créer les boutons de navigation (Précédent / Suivant)
    function createNavigationButtons(startIndex, endIndex, totalCount) {
        const carouselWrapper = document.getElementById('carousel-wrapper');

        // Supprimer les anciens boutons s'ils existent
        const oldPrev = carouselWrapper.querySelector('.prev-btn');
        const oldNext = carouselWrapper.querySelector('.next-btn');
        if (oldPrev) oldPrev.remove();
        if (oldNext) oldNext.remove();

        // Bouton Précédent
        if (startIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-arrow-btn prev-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.title = "Voir les profils précédents";
            prevBtn.onclick = () => showBatch(startIndex - BATCH_SIZE);
            carouselWrapper.appendChild(prevBtn);
        }

        // Bouton Suivant
        if (endIndex < totalCount) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-arrow-btn next-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.title = "Voir les profils suivants";
            nextBtn.onclick = () => showBatch(startIndex + BATCH_SIZE);
            carouselWrapper.appendChild(nextBtn);
        }
    }

    // Créer une carte de profil
    function createProfileCard(profile) {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.userId = profile.id;

        const likeBtnClass = 'like-btn';
        const viewProfileBtnClass = 'view-profile-btn';

        card.innerHTML = `
            <div class="profile-image" style="background-image: url('${profile.profilePictureUrl || 'https://via.placeholder.com/300x400?text=Photo+de+profil'}')"></div>
            <div class="profile-info">
                <h3>${profile.fullName || (profile.firstName ? profile.firstName + ' ' + (profile.lastName || '') : '') || profile.name || 'Utilisateur'}, ${profile.age || ''}</h3>
                <p class="location">${profile.location || ''}</p>
                <div class="profile-actions">
                    <button class="${likeBtnClass}" title="Aimer ce profil">
                        <i class="fas fa-heart"></i> Demander match
                    </button>
                    <button class="${viewProfileBtnClass}" title="Voir le profil">
                        <i class="fas fa-user"></i> Voir bio
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Gérer les actions (like, vue du profil)
    async function handleAction(userId, action) {
        if (!isLoggedIn) {
            showLoginRequired();
            return;
        }

        try {
            console.log(`Traitement de l'action ${action} pour l'utilisateur ${userId}`);
            const response = await fetch(`/api/profiles/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du traitement de la demande');
            }

            const data = await response.json();

            if (data.match) {
                showMatchModal(data.matchedUser);
            }

            // Mettre à jour l'interface utilisateur
            const userCard = document.querySelector(`[data-user-id="${userId}"]`);
            if (userCard) {
                userCard.remove();
            }

            console.log(`Action ${action} réussie pour l'utilisateur ${userId}`);

        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        }
    }

    // Afficher la modale de connexion requise
    function showLoginRequired() {
        if (confirm('Vous devez être connecté pour effectuer cette action. Voulez-vous vous connecter maintenant ?')) {
            window.location.href = 'connexion.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    // Afficher un message d'erreur
    function showErrorMessage(message) {
        profilesContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Réessayer</button>
            </div>`;
    }

    // Afficher un message quand il n'y a plus de profils
    function showNoProfilesMessage() {
        profilesContainer.innerHTML = `
            <div class="no-profiles">
                <h3>Plus de profils à afficher pour le moment</h3>
                <p>Revenez plus tard pour découvrir de nouvelles personnes !</p>
            </div>
        `;
    }

    // Mettre à jour l'interface en fonction de l'état d'authentification
    function updateUIForAuthState(isAuthenticated) {
        const loginLink = document.getElementById('loginBtn');
        if (loginLink) {
            if (isAuthenticated) {
                loginLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Déconnexion';
                loginLink.href = '#';
                loginLink.onclick = (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    window.location.reload();
                };
            } else {
                loginLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Connexion';
                loginLink.href = 'connexion.html';
                loginLink.onclick = null;
            }
        }
    }

    // Fonction pour afficher la modale de match
    function showMatchModal(matchedUser) {
        const modal = document.createElement('div');
        modal.className = 'match-modal';
        modal.innerHTML = `
            <div class="match-content">
                <h2>C'est un match !</h2>
                <p>Vous avez un nouveau match avec ${matchedUser.name} !</p>
                <div class="match-actions">
                    <button id="sendMessageBtn" class="btn btn-primary">Envoyer un message</button>
                    <button id="continueBtn" class="btn btn-secondary">Continuer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Gestion des événements des boutons
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            window.location.href = `chat.html?user=${matchedUser.id}`;
        });

        document.getElementById('continueBtn').addEventListener('click', () => {
            modal.remove();
        });
    }

    // Afficher les détails du profil
    async function viewProfile(userId) {
        if (!isLoggedIn) {
            showLoginRequired();
            return;
        }

        try {
            console.log(`Chargement du profil ${userId}...`);
            const response = await fetch(`/api/profiles/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement du profil');
            }

            const profile = await response.json();
            showProfileModal(profile);

        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger le profil. Veuillez réessayer.');
        }
    }

    // Afficher la modale de profil
    function showProfileModal(profile) {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="profile-header">
                    <div class="profile-image" style="background-image: url('${profile.profilePictureUrl || 'https://via.placeholder.com/300x400?text=Photo+de+profil'}')"></div>
                    <div class="profile-header-info">
                        <h2>${profile.fullName || (profile.firstName ? profile.firstName + ' ' + (profile.lastName || '') : '') || profile.name || 'Utilisateur'}, ${profile.age || ''}</h2>
                        <p class="location">${profile.location || ''}</p>
                    </div>
                </div>
                <div class="profile-details">
                    <h3>À propos</h3>
                    <p>${profile.bio || 'Aucune biographie disponible.'}</p>
                    
                    ${profile.interests && profile.interests.length > 0 ? `
                        <h3>Centres d'intérêt</h3>
                        <div class="interests">
                            ${profile.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="profile-actions">
                    <button class="btn btn-primary like-btn" data-user-id="${profile.id}">
                        <i class="fas fa-heart"></i> J'aime
                    </button>
                    <button class="btn btn-secondary close-profile">Fermer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Gestion des événements
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.close-profile').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.like-btn').addEventListener('click', (e) => {
            const userId = e.target.closest('.like-btn').dataset.userId;
            handleAction(userId, 'like');
            modal.remove();
        });

        // Fermer la modale en cliquant en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Fonction pour mélanger un tableau (Fisher-Yates Shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});