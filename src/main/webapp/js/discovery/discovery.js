document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des événements des boutons like/dislike
    const likeButtons = document.querySelectorAll('.like-btn');
    const dislikeButtons = document.querySelectorAll('.dislike-btn');
    const reportButtons = document.querySelectorAll('.report-btn');

    function handleAction(userId, action) {
        fetch(`/api/users/${userId}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.match) {
                showMatchModal(data.matchedUser);
            }
            // Supprimer la carte de l'utilisateur actuel
            const userCard = document.querySelector(`[data-user-id="${userId}"]`);
            if (userCard) {
                userCard.remove();
            }
            // Charger le profil suivant si disponible
            loadNextProfile();
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Une erreur est survenue');
        });
    }

    likeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.closest('.profile-card').dataset.userId;
            handleAction(userId, 'like');
        });
    });

    dislikeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.closest('.profile-card').dataset.userId;
            handleAction(userId, 'dislike');
        });
    });

    reportButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.closest('.profile-card').dataset.userId;
            if (confirm('Signaler ce profil ?')) {
                handleAction(userId, 'report');
            }
        });
    });

    // Fonction pour charger le profil suivant
    function loadNextProfile() {
        fetch('/api/users/suggestions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(profile => {
            if (profile) {
                displayProfile(profile);
            } else {
                // Afficher un message quand il n'y a plus de profils
                document.getElementById('profiles-container').innerHTML = `
                    <div class="no-profiles">
                        <h3>Plus de profils à afficher pour le moment</h3>
                        <p>Revenez plus tard pour découvrir de nouvelles personnes !</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des profils');
        });
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
});