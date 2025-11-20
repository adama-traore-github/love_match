document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');
    const profileInfo = document.getElementById('profileInfo');
    const profileEdit = document.getElementById('profileEdit');
    const profilePhoto = document.getElementById('profilePhoto');
    const photoPreview = document.getElementById('photoPreview');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const deletePhotoBtn = document.getElementById('deletePhotoBtn');
    const interestsContainer = document.getElementById('interestsContainer');
    const editInterestsBtn = document.getElementById('editInterestsBtn');
    const saveInterestsBtn = document.getElementById('saveInterestsBtn');
    const cancelInterestsBtn = document.getElementById('cancelInterestsBtn');
    const interestsList = document.getElementById('interestsList');
    const editInterestsSection = document.getElementById('editInterestsSection');

    // Afficher le formulaire d'édition
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            profileInfo.style.display = 'none';
            profileEdit.style.display = 'block';
            loadProfileForm();
        });
    }

    // Annuler l'édition
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            profileEdit.style.display = 'none';
            profileInfo.style.display = 'block';
        });
    }

    // Gestion du changement de photo
    if (changePhotoBtn && profilePhoto) {
        changePhotoBtn.addEventListener('click', function() {
            profilePhoto.click();
        });

        profilePhoto.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoPreview.src = event.target.result;
                    photoPreview.style.display = 'block';
                    deletePhotoBtn.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Suppression de la photo
    if (deletePhotoBtn) {
        deletePhotoBtn.addEventListener('click', function() {
            photoPreview.src = 'images/default-avatar.png';
            photoPreview.style.display = 'block';
            deletePhotoBtn.style.display = 'none';
            if (profilePhoto) {
                profilePhoto.value = '';
            }
        });
    }

    // Édition des centres d'intérêt
    if (editInterestsBtn) {
        editInterestsBtn.addEventListener('click', function() {
            interestsContainer.style.display = 'none';
            editInterestsSection.style.display = 'block';
            loadInterestsForm();
        });
    }

    // Annuler l'édition des centres d'intérêt
    if (cancelInterestsBtn) {
        cancelInterestsBtn.addEventListener('click', function() {
            editInterestsSection.style.display = 'none';
            interestsContainer.style.display = 'block';
        });
    }

    // Sauvegarder le profil
    if (saveProfileBtn && profileForm) {
        saveProfileBtn.addEventListener('click', function() {
            const formData = new FormData(profileForm);
            
            // Désactiver le bouton pendant l'envoi
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Enregistrement...';

            fetch('/api/profile', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mettre à jour l'affichage avec les nouvelles données
                    updateProfileDisplay(data.user);
                    // Revenir à la vue normale
                    profileEdit.style.display = 'none';
                    profileInfo.style.display = 'block';
                } else {
                    alert(data.message || 'Une erreur est survenue lors de la mise à jour du profil');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de la mise à jour du profil');
            })
            .finally(() => {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Enregistrer les modifications';
            });
        });
    }

    // Sauvegarder les centres d'intérêt
    if (saveInterestsBtn) {
        saveInterestsBtn.addEventListener('click', function() {
            const selectedInterests = Array.from(document.querySelectorAll('.interest-checkbox:checked'))
                .map(checkbox => checkbox.value);
            
            saveInterestsBtn.disabled = true;
            saveInterestsBtn.textContent = 'Enregistrement...';

            fetch('/api/profile/interests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ interests: selectedInterests })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mettre à jour l'affichage des centres d'intérêt
                    updateInterestsDisplay(data.interests);
                    // Revenir à la vue normale
                    editInterestsSection.style.display = 'none';
                    interestsContainer.style.display = 'block';
                } else {
                    alert(data.message || 'Une erreur est survenue lors de la mise à jour des centres d\'intérêt');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de la mise à jour des centres d\'intérêt');
            })
            .finally(() => {
                saveInterestsBtn.disabled = false;
                saveInterestsBtn.textContent = 'Enregistrer';
            });
        });
    }

    // Charger les données du profil dans le formulaire
    function loadProfileForm() {
        fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(user => {
            if (user) {
                // Remplir le formulaire avec les données de l'utilisateur
                document.getElementById('firstName').value = user.firstName || '';
                document.getElementById('lastName').value = user.lastName || '';
                document.getElementById('email').value = user.email || '';
                document.getElementById('phone').value = user.phone || '';
                document.getElementById('birthDate').value = user.birthDate ? user.birthDate.split('T')[0] : '';
                document.getElementById('bio').value = user.bio || '';
                
                // Mettre à jour la photo de profil si elle existe
                if (user.profilePhoto) {
                    photoPreview.src = `/uploads/profiles/${user.profilePhoto}`;
                    photoPreview.style.display = 'block';
                    deletePhotoBtn.style.display = 'inline-block';
                } else {
                    photoPreview.src = 'images/default-avatar.png';
                    photoPreview.style.display = 'block';
                    deletePhotoBtn.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement du profil:', error);
            alert('Impossible de charger les données du profil');
        });
    }

    // Charger les centres d'intérêt dans le formulaire
    function loadInterestsForm() {
        fetch('/api/interests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.interests && data.userInterests) {
                const userInterestIds = new Set(data.userInterests.map(i => i.id));
                
                // Créer la liste des centres d'intérêt avec des cases à cocher
                const interestsHtml = data.interests.map(interest => `
                    <div class="interest-item">
                        <input type="checkbox" 
                               id="interest-${interest.id}" 
                               class="interest-checkbox" 
                               value="${interest.id}"
                               ${userInterestIds.has(interest.id) ? 'checked' : ''}>
                        <label for="interest-${interest.id}">${interest.name}</label>
                    </div>
                `).join('');
                
                interestsList.innerHTML = interestsHtml;
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des centres d\'intérêt:', error);
            interestsList.innerHTML = '<p>Impossible de charger les centres d\'intérêt. Veuillez réessayer plus tard.</p>';
        });
    }

    // Mettre à jour l'affichage du profil avec les nouvelles données
    function updateProfileDisplay(user) {
        // Mettre à jour les informations affichées
        document.getElementById('displayName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('displayBio').textContent = user.bio || 'Aucune biographie';
        document.getElementById('displayEmail').textContent = user.email || 'Non renseigné';
        document.getElementById('displayPhone').textContent = user.phone || 'Non renseigné';
        
        // Mettre à jour la photo de profil si elle a changé
        if (user.profilePhoto) {
            document.querySelector('.profile-avatar').src = `/uploads/profiles/${user.profilePhoto}`;
        }
    }

    // Mettre à jour l'affichage des centres d'intérêt
    function updateInterestsDisplay(interests) {
        if (interests && interests.length > 0) {
            const interestsHtml = interests.map(interest => 
                `<span class="interest-tag">${interest.name}</span>`
            ).join('');
            document.getElementById('userInterests').innerHTML = interestsHtml;
        } else {
            document.getElementById('userInterests').innerHTML = 
                '<p>Aucun centre d\'intérêt sélectionné</p>';
        }
    }

    // Charger les données du profil au chargement de la page
    if (profileInfo) {
        fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(user => {
            if (user) {
                updateProfileDisplay(user);
                
                // Charger les centres d'intérêt de l'utilisateur
                if (user.interests && user.interests.length > 0) {
                    updateInterestsDisplay(user.interests);
                } else {
                    document.getElementById('userInterests').innerHTML = 
                        '<p>Aucun centre d\'intérêt sélectionné</p>';
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement du profil:', error);
        });
    }
});