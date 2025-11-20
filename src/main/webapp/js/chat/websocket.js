// Gestionnaire de connexion WebSocket centralisé
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 secondes
        this.subscribers = new Map();
        this.isConnected = false;
    }

    // Établir la connexion WebSocket
    connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('Une connexion WebSocket est déjà établie ou en cours d\'établissement');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        this.socket = new WebSocket(`${protocol}${window.location.host}/ws`);

        this.socket.onopen = () => {
            console.log('Connexion WebSocket établie');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.notifySubscribers('connection', { connected: true });
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.notifySubscribers(message.type || 'message', message);
            } catch (error) {
                console.error('Erreur lors du traitement du message WebSocket:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('Connexion WebSocket fermée');
            this.isConnected = false;
            this.notifySubscribers('connection', { connected: false });
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
            this.socket.close();
        };
    }

    // Gérer la reconnexion
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
            
            console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay/1000} secondes...`);
            
            setTimeout(() => {
                this.connect();
            }, Math.min(delay, 30000)); // Ne pas dépasser 30 secondes
        } else {
            console.error('Nombre maximum de tentatives de reconnexion atteint');
            this.notifySubscribers('error', { 
                message: 'Impossible de se reconnecter au serveur. Veuillez rafraîchir la page.' 
            });
        }
    }

    // S'abonner aux événements WebSocket
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
        
        // Retourner une fonction pour se désabonner
        return () => this.unsubscribe(event, callback);
    }

    // Se désabonner d'un événement
    unsubscribe(event, callback) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).delete(callback);
        }
    }

    // Notifier les abonnés d'un événement
    notifySubscribers(event, data) {
        if (this.subscribers.has(event)) {
            for (const callback of this.subscribers.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erreur dans le callback pour l'événement '${event}':`, error);
                }
            }
        }
    }

    // Envoyer un message via WebSocket
    send(message) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.socket.send(messageStr);
            return true;
        } else {
            console.warn('Impossible d\'envoyer le message: la connexion WebSocket n\'est pas établie');
            return false;
        }
    }

    // Fermer la connexion WebSocket
    close() {
        if (this.socket) {
            this.socket.close();
            this.isConnected = false;
        }
    }
}

// Exporter une instance unique du gestionnaire WebSocket
const webSocketManager = new WebSocketManager();

// Exporter des fonctions utilitaires pour une utilisation plus simple
export function initWebSocket() {
    webSocketManager.connect();
}

export function subscribeToWebSocket(event, callback) {
    return webSocketManager.subscribe(event, callback);
}

export function sendWebSocketMessage(message) {
    return webSocketManager.send(message);
}

export function closeWebSocket() {
    webSocketManager.close();
}

export function isWebSocketConnected() {
    return webSocketManager.isConnected;
}

// Exporter le gestionnaire complet pour une utilisation avancée si nécessaire
export default webSocketManager;