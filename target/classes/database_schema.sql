-- Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    bio TEXT,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Création de la table des messages
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances des requêtes de messagerie
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON messages(receiver_id, sender_id);

-- Table pour stocker les connexions WebSocket actives
CREATE TABLE IF NOT EXISTS active_connections (
    connection_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les likes/dislikes
CREATE TABLE IF NOT EXISTS user_likes (
    liker_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    liked_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_like BOOLEAN NOT NULL, -- true pour like, false pour dislike
    PRIMARY KEY (liker_id, liked_user_id)
);

-- Table pour les matchs
CREATE TABLE IF NOT EXISTS matches (
    user1_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Pour éviter les doublons (1-2 est la même paire que 2-1)
);

-- Table pour les photos de profil
CREATE TABLE IF NOT EXISTS user_photos (
    photo_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    photo_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les intérêts/hobbies
CREATE TABLE IF NOT EXISTS interests (
    interest_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Table de liaison entre utilisateurs et intérêts
CREATE TABLE IF NOT EXISTS user_interests (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    interest_id INTEGER NOT NULL REFERENCES interests(interest_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);
