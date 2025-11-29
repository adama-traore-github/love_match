document.addEventListener('DOMContentLoaded', function () {
    console.log('[Profile] Initialisation...');
    loadUserProfile();

    // Gestion du modal d'édition
    const modal = document.getElementById('edit-profile-modal');
    const editBtn = document.querySelector('.btn-edit-profile');
    const closeBtn = document.querySelector('.close-modal');
    const editForm = document.getElementById('edit-profile-form');

    if (editBtn && modal) {
        editBtn.addEventListener('click', function () {
            openEditModal();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }

    // Gestion de la photo de profil
    const avatarBtn = document.querySelector('.edit-avatar-btn');
    const avatarInput = document.getElementById('avatar-input');

    if (avatarBtn && avatarInput) {
        avatarBtn.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', async function (e) {
            if (this.files && this.files[0]) {
                await uploadProfilePicture(this.files[0]);
            }
        });
    }
});

async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/profiles/photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                document.getElementById('profile-pic').src = data.profilePictureUrl;
                alert('Photo de profil mise à jour !');
            }
        } else {
            throw new Error('Erreur upload');
        }
    } catch (error) {
        console.error('Erreur upload:', error);
        alert('Impossible de mettre à jour la photo.');
    }
}

let currentUserData = null; // Stocker les données utilisateur pour le formulaire
let availableInterests = []; // Stocker tous les intérêts disponibles

async function loadAvailableInterests() {
    try {
        const response = await fetch('/api/profiles/interests');
        if (response.ok) {
            availableInterests = await response.json();
        }
    } catch (error) {
        console.error("Erreur chargement intérêts:", error);
    }
}

// Charger les intérêts au démarrage
document.addEventListener('DOMContentLoaded', loadAvailableInterests);

async function openEditModal() {
    if (!currentUserData) return;

    const modal = document.getElementById('edit-profile-modal');

    // Pré-remplir le formulaire
    document.getElementById('edit-email').value = currentUserData.email || '';
    document.getElementById('edit-firstname').value = currentUserData.firstName || '';
    document.getElementById('edit-lastname').value = currentUserData.lastName || '';
    document.getElementById('edit-city').value = currentUserData.city || '';
    document.getElementById('edit-bio').value = currentUserData.bio || '';
    document.getElementById('edit-phone').value = currentUserData.phoneNumber || '';
    document.getElementById('edit-gender').value = currentUserData.gender || 'Male';
    document.getElementById('edit-preference').value = currentUserData.searchPreference || 'Female';

    // Générer les tags d'intérêts
    const container = document.getElementById('interests-selection');
    container.innerHTML = '';

    const userInterests = new Set(currentUserData.interests || []);

    availableInterests.forEach(interest => {
        const tag = document.createElement('div');
        tag.className = 'interest-tag' + (userInterests.has(interest) ? ' selected' : '');
        tag.textContent = interest;
        tag.onclick = function () {
            this.classList.toggle('selected');
        };
        container.appendChild(tag);
    });

    modal.style.display = 'block';
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // Récupérer les intérêts sélectionnés
    const selectedTags = document.querySelectorAll('.interest-tag.selected');
    const interests = Array.from(selectedTags).map(tag => tag.textContent);

    const formData = {
        email: document.getElementById('edit-email').value,
        firstName: document.getElementById('edit-firstname').value,
        lastName: document.getElementById('edit-lastname').value,
        city: document.getElementById('edit-city').value,
        bio: document.getElementById('edit-bio').value,
        phoneNumber: document.getElementById('edit-phone').value,
        gender: document.getElementById('edit-gender').value,
        searchPreference: document.getElementById('edit-preference').value,
        interests: interests
    };

    try {
        const response = await fetch(`/api/profiles/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Profil mis à jour avec succès !');
            document.getElementById('edit-profile-modal').style.display = 'none';
            loadUserProfile(); // Recharger les données affichées
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la mise à jour du profil.');
    }
}

async function loadUserProfile() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
        console.log('[Profile] Utilisateur non connecté');
        // Le message "non connecté" est déjà géré par app.js
        return;
    }

    try {
        console.log(`[Profile] Chargement du profil ${userId}...`);
        const response = await fetch(`/api/profiles/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const user = await response.json();
        console.log('[Profile] Données reçues:', user);

        currentUserData = user; // Stocker pour l'édition

        displayUserProfile(user);

    } catch (error) {
        console.error('[Profile] Erreur lors du chargement:', error);
        document.querySelector('.profile-container').innerHTML = `
            <div class="error-message">
                <p>Impossible de charger votre profil.</p>
                <button onclick="location.reload()" class="btn-primary">Réessayer</button>
            </div>
        `;
    }
}

function displayUserProfile(user) {
    // 1. En-tête
    const profilePic = document.getElementById('profile-pic');
    if (profilePic) {
        profilePic.src = user.profilePictureUrl || 'https://via.placeholder.com/150?text=Photo';
    }

    setText('user-name', user.fullName || `${user.firstName} ${user.lastName}`);
    setText('user-age', user.age ? `${user.age} ans` : '');
    setText('user-city', user.city || 'Ville non renseignée');

    // 2. Bio
    setText('user-bio', user.bio || 'Aucune biographie pour le moment.');

    // 3. Détails
    setText('detail-email', user.email);
    setText('detail-phone', user.phoneNumber || 'Non renseigné');
    setText('detail-gender', translateGender(user.gender));
    setText('detail-preference', translatePreference(user.searchPreference));

    // 4. Intérêts
    const interestsContainer = document.getElementById('user-interests');
    if (interestsContainer) {
        interestsContainer.innerHTML = '';
        if (user.interests && user.interests.length > 0) {
            user.interests.forEach(interest => {
                const tag = document.createElement('span');
                tag.className = 'interest-tag';
                tag.textContent = interest;
                interestsContainer.appendChild(tag);
            });
        } else {
            interestsContainer.innerHTML = '<span class="no-data">Aucun centre d\'intérêt renseigné</span>';
        }
    }
}

function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text || '';
    }
}

function translateGender(gender) {
    if (!gender) return 'Non spécifié';
    const g = gender.toLowerCase();
    if (g === 'male' || g === 'homme' || g === 'm') return 'Homme';
    if (g === 'female' || g === 'femme' || g === 'f') return 'Femme';
    return gender;
}

function translatePreference(pref) {
    if (!pref) return 'Non spécifié';
    const p = pref.toLowerCase();
    if (p === 'male' || p === 'homme') return 'Hommes';
    if (p === 'female' || p === 'femme') return 'Femmes';
    if (p === 'both' || p === 'tous') return 'Tout le monde';
    return pref;
}
