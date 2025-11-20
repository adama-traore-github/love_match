document.addEventListener('DOMContentLoaded', function() {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typingIndicator');
    let typingTimeout;

    // Initialiser la connexion WebSocket
    initWebSocket();

    if (messageForm && messageInput) {
        // Gestion de l'envoi de message
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                sendMessage(message);
                messageInput.value = '';
            }
        });

        // Gestion de l'indicateur de frappe
        messageInput.addEventListener('input', function() {
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
    }

    // Fonction pour envoyer un message
    function sendMessage(message) {
        const messageData = {
            type: 'message',
            content: message,
            recipientId: getRecipientId(),
            timestamp: new Date().toISOString()
        };

        // Envoyer via WebSocket
        if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
            window.websocket.send(JSON.stringify(messageData));
        }

        // Afficher le message dans l'interface
        appendMessage({
            content: message,
            sender: 'me',
            timestamp: new Date().toISOString()
        });
    }

    // Fonction pour afficher un message dans le chat
    function appendMessage(message) {
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
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
        const ws = new WebSocket(`${protocol}${window.location.host}/ws`);
        
        window.websocket = ws;

        ws.onopen = function() {
            console.log('Connexion WebSocket établie');
            // Charger les anciens messages
            loadMessages();
        };

        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'message':
                    appendMessage({
                        content: data.content,
                        sender: data.sender,
                        timestamp: data.timestamp
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

        ws.onclose = function() {
            console.log('Connexion WebSocket fermée');
            // Tentative de reconnexion après 5 secondes
            setTimeout(initWebSocket, 5000);
        };
    }

    // Fonction pour charger les anciens messages
    function loadMessages() {
        const recipientId = getRecipientId();
        if (!recipientId) return;

        fetch(`/api/messages?recipientId=${recipientId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(messages => {
            messages.forEach(message => {
                appendMessage({
                    content: message.content,
                    sender: message.senderId === getCurrentUserId() ? 'me' : 'other',
                    timestamp: message.timestamp
                });
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des messages:', error);
        });
    }

    // Fonction utilitaire pour obtenir l'ID du destinataire depuis l'URL
    function getRecipientId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('user');
    }

    // Fonction utilitaire pour obtenir l'ID de l'utilisateur actuel
    function getCurrentUserId() {
        // À implémenter selon votre système d'authentification
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
});