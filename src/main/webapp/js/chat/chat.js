document.addEventListener('DOMContentLoaded', function () {
    console.log("[Chat] DOMContentLoaded");
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typingIndicator');
    let typingTimeout;

    // Initialiser la connexion WebSocket
    initWebSocket();

    // Charger les infos du profil
    const recipientId = getRecipientId();
    if (recipientId) {
        loadUserProfile(recipientId);
    }

    if (messageForm && messageInput) {
        // Gestion de l'envoi de message
        messageForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("[Chat] Form submit triggered");
            const message = messageInput.value.trim();
            const file = fileInput.files[0];

            if (message || file) {
                console.log("[Chat] Sending message:", { message, file: file ? file.name : 'none' });
                sendMessage(message, file);
                messageInput.value = '';
                fileInput.value = ''; // Reset file input
                const preview = document.getElementById('attachment-preview');
                if (preview) {
                    preview.style.display = 'none';
                    preview.innerHTML = '';
                }
            } else {
                console.warn("[Chat] Attempted to send empty message");
            }
        });

        // Gestion de l'indicateur de frappe
        messageInput.addEventListener('input', function () {
            sendTypingIndicator();

            // Réinitialiser le délai d'arrêt de frappe
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                // Cacher l'indicateur après 2 secondes d'inactivité
                if (typingIndicator) {
                    typingIndicator.style.display = 'none';
                }
            }, 2000);
        });

        // Gestion de la prévisualisation de fichier
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            console.log("[Chat] File selected:", file ? file.name : 'none');
            const previewContainer = document.getElementById('attachment-preview');

            if (file) {
                previewContainer.style.display = 'block';
                if (file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    previewContainer.innerHTML = `<img src="${url}" style="max-height: 100px; border-radius: 8px;"> <span style="font-size: 0.8rem; color: #666;">${file.name}</span>`;
                } else {
                    previewContainer.innerHTML = `<i class="fas fa-file"></i> <span style="font-size: 0.8rem; color: #666;">${file.name}</span>`;
                }
            } else {
                previewContainer.style.display = 'none';
                previewContainer.innerHTML = '';
            }
        });
    }

    // Fonction pour envoyer un message
    function sendMessage(message, file) {
        const recipientId = getRecipientId();
        console.log("[Chat] sendMessage called. Recipient:", recipientId);

        // Si on a un fichier, on utilise l'API HTTP (POST multipart)
        if (file) {
            console.log("[Chat] Sending via HTTP (Multipart)");
            const formData = new FormData();
            formData.append('receiverId', recipientId);
            formData.append('content', message);
            formData.append('file', file);

            fetch('/api/messages/send', {
                method: 'POST',
                body: formData // Pas de Content-Type header, le navigateur le mettra avec boundary
            })
                .then(response => {
                    console.log("[Chat] HTTP Upload response status:", response.status);
                    return response.json();
                })
                .then(data => {
                    console.log("[Chat] HTTP Upload response data:", data);
                    if (data.success) {
                        // On peut afficher le message localement ou attendre le WebSocket
                        // Pour l'instant, on attend le WebSocket pour simplifier (le serveur devrait broadcaster)
                        // Mais comme notre WebSocket actuel ne broadcast pas les uploads HTTP, on l'ajoute manuellement
                        // Note: Idéalement le serveur devrait envoyer un event WS après l'upload

                        // Simulation d'affichage immédiat (sans URL réelle pour l'instant, ou avec URL blob)
                        appendMessage({
                            content: message,
                            sender: 'me',
                            timestamp: new Date().toISOString(),
                            attachmentUrl: URL.createObjectURL(file), // Preview locale
                            attachmentType: file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'document')
                        });
                    }
                })
                .catch(error => console.error('[Chat] Erreur upload:', error));

        } else {
            // Message texte simple via HTTP POST (pour garantir la persistance)
            console.log("[Chat] Sending via HTTP POST");

            fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    receiverId: recipientId,
                    content: message
                })
            })
                .then(response => {
                    if (!response.ok) throw new Error('Erreur réseau');
                    return response.json();
                })
                .then(data => {
                    console.log("[Chat] Message sent successfully via HTTP");
                    // Afficher le message dans l'interface immédiatement
                    appendMessage({
                        content: message,
                        sender: 'me',
                        timestamp: new Date().toISOString()
                    });
                })
                .catch(error => console.error('[Chat] Erreur envoi message:', error));
        }
    }

    // Fonction pour afficher un message dans le chat
    function appendMessage(message) {
        console.log("[Chat] appendMessage:", message);
        if (!messagesContainer) {
            console.error("[Chat] messagesContainer not found!");
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;

        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let attachmentHtml = '';
        if (message.attachmentUrl) {
            if (message.attachmentType === 'image') {
                attachmentHtml = `<div class="attachment"><img src="${message.attachmentUrl}" alt="Image" style="max-width: 200px; border-radius: 8px;"></div>`;
            } else if (message.attachmentType === 'video') {
                attachmentHtml = `<div class="attachment"><video src="${message.attachmentUrl}" controls style="max-width: 200px; border-radius: 8px;"></video></div>`;
            } else {
                attachmentHtml = `<div class="attachment"><a href="${message.attachmentUrl}" target="_blank" class="doc-link"><i class="fas fa-file-alt"></i> Document</a></div>`;
            }
        }

        messageElement.innerHTML = `
            <div class="message-content">
                ${attachmentHtml}
                ${message.content ? `<p>${message.content}</p>` : ''}
            </div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Fonction pour envoyer l'indicateur de frappe
    function sendTypingIndicator() {
        if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
            window.websocket.send(JSON.stringify({
                type: 'typing',
                recipientId: getRecipientId()
            }));
        }
    }

    // Fonction pour initialiser la connexion WebSocket
    function initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${window.location.host}/ws`;
        console.log("[Chat] Connecting to WebSocket:", wsUrl);

        // Charger les messages immédiatement via HTTP (indépendamment du WS)
        loadMessages();

        const ws = new WebSocket(wsUrl);

        window.websocket = ws;

        ws.onopen = function () {
            console.log('[Chat] Connexion WebSocket établie');
            // On peut recharger ou synchroniser ici si besoin
        };

        ws.onmessage = function (event) {
            console.log("[Chat] WebSocket message received:", event.data);
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'message':
                    appendMessage({
                        content: data.content,
                        sender: data.sender,
                        timestamp: data.timestamp,
                        attachmentUrl: data.attachmentUrl, // Assurez-vous que le WS renvoie ça
                        attachmentType: data.attachmentType
                    });
                    break;

                case 'typing':
                    if (typingIndicator) {
                        typingIndicator.style.display = 'block';
                        clearTimeout(typingIndicator.timeout);
                        typingIndicator.timeout = setTimeout(() => {
                            typingIndicator.style.display = 'none';
                        }, 2000);
                    }
                    break;

                case 'status':
                    updateUserStatus(data.userId, data.status);
                    break;
            }
        };

        ws.onclose = function (event) {
            console.log('[Chat] Connexion WebSocket fermée', event);
            // Tentative de reconnexion après 5 secondes
            setTimeout(initWebSocket, 5000);
        };

        ws.onerror = function (error) {
            console.error("[Chat] WebSocket error:", error);
        };
    }

    // Fonction pour charger les anciens messages
    function loadMessages() {
        const recipientId = getRecipientId();
        console.log("[Chat] Loading messages for recipient:", recipientId);

        if (!recipientId) {
            console.warn("[Chat] No recipient ID found in URL");
            return;
        }

        fetch(`/api/messages/conversation?userId=${recipientId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(response => {
                console.log("[Chat] Load messages response status:", response.status);
                return response.json();
            })
            .then(messages => {
                console.log("[Chat] Messages loaded:", messages.length);
                messagesContainer.innerHTML = ''; // Clear existing messages
                messages.forEach(message => {
                    appendMessage({
                        content: message.content,
                        sender: message.senderId == getCurrentUserId() ? 'me' : 'other', // Attention au type (string vs number)
                        timestamp: message.sentAt, // L'API renvoie sentAt
                        attachmentUrl: message.attachmentUrl,
                        attachmentType: message.attachmentType
                    });
                });
            })
            .catch(error => {
                console.error('[Chat] Erreur lors du chargement des messages:', error);
            });
    }

    // Fonction utilitaire pour obtenir l'ID du destinataire depuis l'URL
    function getRecipientId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('user');
    }

    // Fonction utilitaire pour obtenir l'ID de l'utilisateur actuel
    function getCurrentUserId() {
        return localStorage.getItem('userId');
    }

    // Fonction pour mettre à jour le statut de l'utilisateur
    function updateUserStatus(userId, status) {
        const userStatusElement = document.querySelector(`[data-user-id="${userId}"] .user-status`);
        if (userStatusElement) {
            userStatusElement.className = `user-status ${status}`;
            userStatusElement.title = status === 'online' ? 'En ligne' : 'Hors ligne';
        }
    }

    // Fonction pour charger le profil de l'utilisateur
    async function loadUserProfile(userId) {
        try {
            const response = await fetch(`/api/profiles/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById('chat-username').textContent = `${user.firstName} ${user.lastName}`;
                const avatar = document.getElementById('chat-avatar');
                if (avatar) {
                    avatar.style.backgroundImage = `url('${user.profilePictureUrl}')`;
                }
            }
        } catch (error) {
            console.error('[Chat] Erreur chargement profil:', error);
        }
    }
});