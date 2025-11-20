document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
    if (localStorage.getItem('token')) {
        window.location.href = '/decouverte.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validation des champs
    if (!email || !password) {
        showError('Veuillez remplir tous les champs');
        return;
    }
    
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Désactiver le bouton pendant la requête
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion en cours...';
    
    try {
        // Afficher les logs de débogage
        console.log('[Login] Tentative de connexion pour:', email);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password, // À remplacer par un hachage côté client dans une version de production
                rememberMe: rememberMe
            }),
            credentials: 'include' // Important pour les cookies de session
        });
        
        const data = await response.json();
        console.log('[Login] Réponse du serveur:', data);
        
        if (response.ok) {
            // Connexion réussie
            if (data.token && data.user) {
                // Stocker les informations utilisateur dans le localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userGender', data.user.gender || '');
                localStorage.setItem('userName', data.user.username || '');
                localStorage.setItem('userEmail', data.user.email || '');
                
                // Si l'utilisateur a coché "Se souvenir de moi"
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                console.log('[Login] Utilisateur connecté avec succès:', {
                    id: data.user.id,
                    email: data.user.email,
                    gender: data.user.gender
                });
                
                // Redirection vers la page d'accueil
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/decouverte.html';
                window.location.href = redirectUrl;
            }
        } else {
            // Afficher l'erreur retournée par le serveur
            const errorMessage = data.message || 'Email ou mot de passe incorrect';
            showError(errorMessage);
            
            // Mettre en surbrillance les champs en erreur
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput && passwordInput) {
                emailInput.classList.add('error');
                passwordInput.classList.add('error');
                
                // Supprimer la classe d'erreur après un certain temps
                setTimeout(() => {
                    emailInput.classList.remove('error');
                    passwordInput.classList.remove('error');
                }, 3000);
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
    } finally {
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Vérifier l'état d'authentification au chargement de la page
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
                // Mettre à jour le localStorage avec les données utilisateur
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userGender', data.user.gender || '');
                localStorage.setItem('userName', data.user.username || '');
                localStorage.setItem('userEmail', data.user.email || '');
                
                // Rediriger si nécessaire
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('register.html')) {
                    window.location.href = '/decouverte.html';
                }
            }
        }
    } catch (error) {
        console.error('[Auth] Erreur lors de la vérification de l\'authentification:', error);
    }
}

// Vérifier l'authentification au chargement de la page
if (window.location.pathname !== '/login.html' && 
    window.location.pathname !== '/register.html') {
    checkAuth();
}

function showError(message) {
    console.error('[Login] Erreur:', message);
    // Supprimer les messages d'erreur existants
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Créer et afficher le nouveau message d'erreur
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#ff4b6e';
    errorElement.style.marginTop = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.style.padding = '10px';
    errorElement.style.borderRadius = '5px';
    errorElement.style.backgroundColor = 'rgba(255, 75, 110, 0.1)';
    errorElement.style.marginBottom = '15px';
    errorElement.textContent = message;
    
    const form = document.getElementById('loginForm');
    if (form) {
        // Insérer le message d'erreur après le titre du formulaire ou au début du formulaire
        const formTitle = form.querySelector('h2');
        if (formTitle) {
            form.insertBefore(errorElement, formTitle.nextSibling);
        } else {
            form.insertBefore(errorElement, form.firstChild);
        }
        
        // Faire défiler jusqu'au message d'erreur
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.error('Formulaire de connexion non trouvé');
    }
}

// Ajout d'un style pour les champs en erreur
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: #ff4b6e !important;
        background-color: rgba(255, 75, 110, 0.05) !important;
    }
    
    .error:focus {
        box-shadow: 0 0 0 2px rgba(255, 75, 110, 0.2) !important;
    }
`;
document.head.appendChild(style);