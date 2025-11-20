// Fonction de validation d'email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Fonction de validation de numéro de téléphone
export function validatePhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
}

// Fonction de validation de mot de passe
export function validatePassword(password) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

// Fonction de validation de date de naissance
export function validateBirthDate(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= 18; // L'utilisateur doit avoir au moins 18 ans
}

// Fonction de validation de nom/prénom
export function validateName(name) {
    const re = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
    return re.test(name);
}

// Fonction de validation de biographie
export function validateBio(bio) {
    return bio.length <= 500; // Limite de 500 caractères
}

// Fonction de validation de sélection d'au moins un centre d'intérêt
export function validateInterests(interests) {
    return interests.length > 0;
}

// Fonction de validation de fichier image
export function validateImageFile(file) {
    if (!file) return true; // Aucun fichier n'est valide (champ non obligatoire)
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Vérifier le type de fichier
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            message: 'Le fichier doit être une image (JPEG, PNG ou GIF)'
        };
    }
    
    // Vérifier la taille du fichier
    if (file.size > maxSize) {
        return {
            valid: false,
            message: 'La taille du fichier ne doit pas dépasser 5 Mo'
        };
    }
    
    return { valid: true };
}

// Fonction de validation de formulaire générique
export function validateForm(formData, rules) {
    const errors = {};
    let isValid = true;
    
    for (const field in rules) {
        const value = formData[field];
        const fieldRules = rules[field];
        
        for (const rule of fieldRules) {
            if (rule.required && !value) {
                errors[field] = rule.message || 'Ce champ est requis';
                isValid = false;
                break;
            }
            
            if (value) {
                if (rule.minLength && value.length < rule.minLength) {
                    errors[field] = rule.message || `Doit contenir au moins ${rule.minLength} caractères`;
                    isValid = false;
                    break;
                }
                
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors[field] = rule.message || `Ne doit pas dépasser ${rule.maxLength} caractères`;
                    isValid = false;
                    break;
                }
                
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = rule.message || 'Format invalide';
                    isValid = false;
                    break;
                }
                
                if (rule.validate && typeof rule.validate === 'function') {
                    const validationResult = rule.validate(value);
                    if (validationResult !== true) {
                        errors[field] = validationResult.message || 'Valeur invalide';
                        isValid = false;
                        break;
                    }
                }
            }
        }
    }
    
    return {
        isValid,
        errors
    };
}

// Exemple d'utilisation de validateForm :
/*
const formData = {
    email: 'test@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    phone: '0612345678',
    bio: 'Une petite biographie...',
    interests: ['sport', 'musique']
};

const validationRules = {
    email: [
        { required: true, message: 'L\'email est requis' },
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' }
    ],
    password: [
        { required: true, message: 'Le mot de passe est requis' },
        { minLength: 8, message: 'Le mot de passe doit contenir au moins 8 caractères' },
        { 
            validate: (value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value),
            message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        }
    ],
    confirmPassword: [
        { 
            validate: (value) => value === formData.password,
            message: 'Les mots de passe ne correspondent pas'
        }
    ],
    firstName: [
        { required: true, message: 'Le prénom est requis' },
        { pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/, message: 'Prénom invalide' }
    ],
    lastName: [
        { required: true, message: 'Le nom est requis' },
        { pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/, message: 'Nom invalide' }
    ],
    birthDate: [
        { 
            validate: (value) => {
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                return age >= 18;
            },
            message: 'Vous devez avoir au moins 18 ans'
        }
    ],
    phone: [
        { required: true, message: 'Le numéro de téléphone est requis' },
        { pattern: /^[0-9]{10}$/, message: 'Numéro de téléphone invalide' }
    ],
    bio: [
        { maxLength: 500, message: 'La biographie ne doit pas dépasser 500 caractères' }
    ],
    interests: [
        { 
            validate: (value) => value && value.length > 0,
            message: 'Sélectionnez au moins un centre d\'intérêt'
        }
    ]
};

const { isValid, errors } = validateForm(formData, validationRules);
*/
