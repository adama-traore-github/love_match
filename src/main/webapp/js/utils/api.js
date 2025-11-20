// Configuration de base de l'API
const API_BASE_URL = '/api';

// En-têtes par défaut
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Fonction utilitaire pour gérer les réponses HTTP
async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        // Si le serveur renvoie une réponse d'erreur
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    return data;
}

// Fonction pour obtenir les en-têtes d'authentification
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Fonction pour effectuer une requête HTTP générique
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Fusionner les en-têtes par défaut avec les en-têtes personnalisés
    const headers = {
        ...DEFAULT_HEADERS,
        ...getAuthHeaders(),
        ...(options.headers || {})
    };

    // Si le corps est un FormData, supprimer l'en-tête Content-Type pour que le navigateur le définisse automatiquement
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers,
        credentials: 'include' // Inclure les cookies dans les requêtes
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Méthodes HTTP simplifiées
const api = {
    // Méthode GET
    get: (endpoint, options = {}) => {
        return fetchApi(endpoint, {
            ...options,
            method: 'GET'
        });
    },

    // Méthode POST
    post: (endpoint, data = {}, options = {}) => {
        const isFormData = data instanceof FormData;
        
        return fetchApi(endpoint, {
            ...options,
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data)
        });
    },

    // Méthode PUT
    put: (endpoint, data = {}, options = {}) => {
        const isFormData = data instanceof FormData;
        
        return fetchApi(endpoint, {
            ...options,
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data)
        });
    },

    // Méthode DELETE
    delete: (endpoint, data = {}, options = {}) => {
        return fetchApi(endpoint, {
            ...options,
            method: 'DELETE',
            body: data ? JSON.stringify(data) : undefined
        });
    },

    // Méthode PATCH
    patch: (endpoint, data = {}, options = {}) => {
        return fetchApi(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
};

// API spécifique pour l'authentification
const auth = {
    // Connexion
    login: (email, password, rememberMe = false) => {
        return api.post('/auth/login', { email, password, rememberMe });
    },

    // Inscription
    register: (userData) => {
        return api.post('/auth/register', userData);
    },

    // Déconnexion
    logout: () => {
        return api.post('/auth/logout');
    },

    // Récupérer l'utilisateur connecté
    getCurrentUser: () => {
        return api.get('/auth/me');
    },

    // Rafraîchir le token
    refreshToken: () => {
        return api.post('/auth/refresh-token');
    }
};

// API pour les profils utilisateurs
const profiles = {
    // Récupérer un profil par ID
    getProfile: (userId) => {
        return api.get(`/profiles/${userId}`);
    },

    // Mettre à jour le profil
    updateProfile: (userId, profileData) => {
        return api.put(`/profiles/${userId}`, profileData);
    },

    // Mettre à jour la photo de profil
    updateProfilePhoto: (userId, photoFile) => {
        const formData = new FormData();
        formData.append('photo', photoFile);
        return api.post(`/profiles/${userId}/photo`, formData);
    },

    // Supprimer la photo de profil
    deleteProfilePhoto: (userId) => {
        return api.delete(`/profiles/${userId}/photo`);
    },

    // Rechercher des profils
    searchProfiles: (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return api.get(`/profiles/search?${queryParams}`);
    }
};

// API pour les matchs
const matches = {
    // Récupérer les matchs d'un utilisateur
    getUserMatches: () => {
        return api.get('/matches');
    },

    // Créer un nouveau match (like)
    createMatch: (targetUserId) => {
        return api.post('/matches', { targetUserId });
    },

    // Supprimer un match (unmatch)
    deleteMatch: (matchId) => {
        return api.delete(`/matches/${matchId}`);
    },

    // Signaler un utilisateur
    reportUser: (userId, reason) => {
        return api.post(`/users/${userId}/report`, { reason });
    }
};

// API pour les messages
const messages = {
    // Récupérer les conversations
    getConversations: () => {
        return api.get('/messages/conversations');
    },

    // Récupérer les messages d'une conversation
    getMessages: (otherUserId, page = 1, limit = 20) => {
        return api.get(`/messages/${otherUserId}?page=${page}&limit=${limit}`);
    },

    // Envoyer un message
    sendMessage: (recipientId, content) => {
        return api.post('/messages', { recipientId, content });
    },

    // Marquer les messages comme lus
    markAsRead: (messageIds) => {
        return api.patch('/messages/read', { messageIds });
    }
};

// API pour les centres d'intérêt
const interests = {
    // Récupérer tous les centres d'intérêt
    getAll: () => {
        return api.get('/interests');
    },

    // Récupérer les centres d'intérêt d'un utilisateur
    getUserInterests: (userId) => {
        return api.get(`/users/${userId}/interests`);
    },

    // Mettre à jour les centres d'intérêt d'un utilisateur
    updateUserInterests: (userId, interestIds) => {
        return api.put(`/users/${userId}/interests`, { interests: interestIds });
    }
};

// API pour les notifications
const notifications = {
    // Récupérer les notifications non lues
    getUnread: () => {
        return api.get('/notifications/unread');
    },

    // Marquer une notification comme lue
    markAsRead: (notificationId) => {
        return api.patch(`/notifications/${notificationId}/read`);
    },

    // Marquer toutes les notifications comme lues
    markAllAsRead: () => {
        return api.patch('/notifications/read-all');
    }
};

// Exporter toutes les API
export default {
    // Méthodes HTTP de base
    ...api,
    
    // API spécifiques
    auth,
    profiles,
    matches,
    messages,
    interests,
    notifications
};
