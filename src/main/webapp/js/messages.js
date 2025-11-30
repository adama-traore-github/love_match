document.addEventListener('DOMContentLoaded', function () {
    console.log('[Messages] Chargement du module messages...');

    const requestsList = document.getElementById('requests-list');
    const sentRequestsList = document.getElementById('sent-requests-list');
    const matchesList = document.getElementById('matches-list');
    const receivedSection = document.getElementById('received-section');
    const sentSection = document.getElementById('sent-section');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (!localStorage.getItem('token')) {
        window.location.href = 'connexion.html';
        return;
    }

    // Gestion des onglets
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.tab === 'received') {
                receivedSection.style.display = 'block';
                sentSection.style.display = 'none';
            } else {
                receivedSection.style.display = 'none';
                sentSection.style.display = 'block';
            }
        });
    });

    loadData();

    async function loadData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'connexion.html';
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Charger les demandes reçues
            const reqResponse = await fetch('/api/matches/requests', { headers });
            const requests = await reqResponse.json();
            renderRequests(requests);

            // 2. Charger les demandes envoyées
            const sentResponse = await fetch('/api/matches/sent', { headers });
            const sentRequests = await sentResponse.json();
            renderSentRequests(sentRequests);

            // 3. Charger les matchs
            const matchResponse = await fetch('/api/matches/list', { headers });
            const matches = await matchResponse.json();
            renderMatches(matches);

        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    }

    function renderRequests(requests) {
        requestsList.innerHTML = '';
        if (requests.length === 0) {
            requestsList.innerHTML = '<p class="no-data">Aucune demande en attente.</p>';
            return;
        }

        requests.forEach(user => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <div class="profile-image-small" style="background-image: url('${user.profilePictureUrl}')"></div>
                <div class="request-info">
                    <h4>${user.firstName}, ${calculateAge(user.dateOfBirth)}</h4>
                    <p>${user.city || ''}</p>
                </div>
                <div class="request-actions">
                    <button onclick="acceptMatch(${user.userId})" class="btn-accept"><i class="fas fa-check"></i></button>
                    <button onclick="rejectMatch(${user.userId})" class="btn-reject"><i class="fas fa-times"></i></button>
                </div>
            `;
            requestsList.appendChild(card);
        });
    }

    function renderSentRequests(requests) {
        sentRequestsList.innerHTML = '';
        if (requests.length === 0) {
            sentRequestsList.innerHTML = '<p class="no-data">Aucune demande envoyée.</p>';
            return;
        }

        requests.forEach(user => {
            const card = document.createElement('div');
            card.className = 'request-card sent';
            card.innerHTML = `
                <div class="profile-image-small" style="background-image: url('${user.profilePictureUrl}')"></div>
                <div class="request-info">
                    <h4>${user.firstName}, ${calculateAge(user.dateOfBirth)}</h4>
                    <p class="status-pending"><i class="fas fa-clock"></i> En attente</p>
                </div>
            `;
            sentRequestsList.appendChild(card);
        });
    }

    function renderMatches(matches) {
        matchesList.innerHTML = '';
        if (matches.length === 0) {
            matchesList.innerHTML = '<p class="no-data">Aucun match pour le moment.</p>';
            return;
        }

        matches.forEach(user => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div class="profile-image-small" style="background-image: url('${user.profilePictureUrl}')"></div>
                <div class="match-info">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <p class="last-message">Cliquez pour discuter...</p>
                </div>
                <div class="match-time"><i class="fas fa-chevron-right"></i></div>
            `;
            card.onclick = () => window.location.href = `chat.html?user=${user.userId}`;
            matchesList.appendChild(card);
        });
    }

    function calculateAge(dob) {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // Fonctions globales pour les boutons (attachées à window)
    window.acceptMatch = async function (userId) {
        try {
            const response = await fetch('/api/matches/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: userId })
            });

            if (response.ok) {
                loadData(); // Recharger tout
            }
        } catch (error) {
            console.error('Erreur acceptation:', error);
        }
    };

    window.rejectMatch = async function (userId) {
        if (!confirm("Refuser cette demande ?")) return;

        try {
            const response = await fetch('/api/matches/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: userId })
            });

            if (response.ok) {
                loadData(); // Recharger pour faire disparaître la carte
            }
        } catch (error) {
            console.error('Erreur refus:', error);
        }
    };
});
