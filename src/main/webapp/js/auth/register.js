// Gestion de l'aperçu photo
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('profilePhoto');
    const photoPreview = document.getElementById('profilePreview');

    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoPreview.src = event.target.result;
                    photoPreview.style.border = "4px solid #4CAF50";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Compteur de tags sélectionnés
    const checkboxes = document.querySelectorAll('.tag-checkbox');
    const countSpan = document.getElementById('selectedInterestsCount');

    function updateCount() {
        const count = document.querySelectorAll('.tag-checkbox:checked').length;
        if (countSpan) {
            countSpan.textContent = `${count} sélectionné(s)`;
            countSpan.style.color = count > 0 ? "#4CAF50" : "#ff4b6e";
        }
    }

    checkboxes.forEach(box => {
        box.addEventListener('change', updateCount);
    });

    // Validation du formulaire
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validation du numéro de téléphone
            const phoneInput = document.getElementById('phone');
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phoneInput.value)) {
                alert('Veuillez entrer un numéro de téléphone valide (10 chiffres)');
                return;
            }

            // Validation des centres d'intérêt
            const selectedInterests = document.querySelectorAll('.tag-checkbox:checked');
            if (selectedInterests.length === 0) {
                alert('Veuillez sélectionner au moins un centre d\'intérêt');
                return;
            }

            // Préparation des données du formulaire
            const formData = new FormData(registerForm);
            
            // Ajout des centres d'intérêt sélectionnés
            selectedInterests.forEach(interest => {
                formData.append('interests', interest.value);
            });

            // Affichage du chargement
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Inscription en cours...';

            try {
                // Envoi des données au serveur
                const response = await fetch('/api/register', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    window.location.href = 'connexion.html?registered=true';
                } else {
                    const error = await response.json();
                    alert(error.message || 'Une erreur est survenue lors de l\'inscription');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur de connexion au serveur');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
});