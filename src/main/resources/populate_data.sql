-- ==========================================================
-- SCRIPT DE PEUPLEMENT FINAL ET CORRIGÉ
-- ==========================================================

-- 1. NETTOYAGE : Vider les tables de données.
TRUNCATE TABLE matches RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_interests RESTART IDENTITY;


-- 2. INSERTION DES UTILISATEURS ET LIAISON DES INTÉRÊTS
DO $$ 
DECLARE
    -- Le hash BCrypt de 'password123'
    p_hash TEXT := '$2a$10$sLuotUC93aHMIi6hyz7czuaDBhHJaaHLfZ8CEha0ZI57utNHHwRra'; 
BEGIN

-- 2.1. Insertion des 20 utilisateurs
INSERT INTO users (
    user_id, first_name, last_name, email, phone_number, password_hash, 
    gender, date_of_birth, city, profile_picture_url, bio, username, search_preference
) 
VALUES 
-- 1. L'Admin (Toi)
(1, 'Adama', 'Traore', 'adama@lovematch.com', '70000001', p_hash, 'male', '2003-01-01', 'Ouagadougou', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Dev Fullstack passionné. Je cherche quelqu''un qui comprend mes blagues de code.', 'adama_t', 'female'),

-- 2. Femmes
(2, 'Amina', 'Ouedraogo', 'amina@test.com', '70000002', p_hash, 'female', '2001-05-15', 'Ouagadougou', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Étudiante en médecine. J''aime la lecture et les voyages.', 'amina_o', 'male'),
(3, 'Fatou', 'Diallo', 'fatou@test.com', '70000003', p_hash, 'female', '1999-11-20', 'Bobo-Dioulasso', 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400', 'Entrepreneur dans la mode. Je cherche une relation sérieuse.', 'fatou_d', 'male'),
(4, 'Sarah', 'Sankara', 'sarah@test.com', '70000004', p_hash, 'female', '2002-03-03', 'Koudougou', 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400', 'Passionnée de musique et de danse traditionnelle.', 'sarah_s', 'male'),
(5, 'Grace', 'Kabore', 'grace@test.com', '70000005', p_hash, 'female', '1998-08-10', 'Ouagadougou', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400', 'Infirmière. J''aime cuisiner le week-end.', 'grace_k', 'male'),
(6, 'Mariam', 'Sawadogo', 'mariam@test.com', '70000006', p_hash, 'female', '2000-12-25', 'Ouahigouya', 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400', 'Joviale et spontanée. Ici pour faire des rencontres sympas.', 'mariam_s', 'male'),
(7, 'Nafissatou', 'Barry', 'nafi@test.com', '70000007', p_hash, 'female', '1997-04-01', 'Banfora', 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400', 'Amoureuse de la nature et des randonnées aux cascades.', 'nafi_b', 'male'),
(8, 'Clarisse', 'Zongo', 'clarisse@test.com', '70000008', p_hash, 'female', '2004-02-28', 'Ouagadougou', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', 'Nouvelle en ville, faites-moi découvrir les bons coins !', 'clarisse_z', 'male'),
(9, 'Juliette', 'Sombie', 'juliette@test.com', '70000009', p_hash, 'female', '1996-06-18', 'Bobo-Dioulasso', 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400', 'Architecte. Je construis des maisons et peut-être notre futur ?', 'juliette_s', 'male'),
(10, 'Kadidia', 'Konate', 'kadi@test.com', '70000010', p_hash, 'female', '2001-09-09', 'Fada N''Gourma', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Simple et authentique.', 'kadi_k', 'male'),

-- 3. Hommes
(11, 'Moussa', 'Ouattara', 'moussa@test.com', '70000011', p_hash, 'male', '1995-10-22', 'Ouagadougou', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Commerçant. Travailleur et ambitieux.', 'moussa_o', 'female'),
(12, 'Jean', 'Ilboudo', 'jean@test.com', '70000012', p_hash, 'male', '1998-07-07', 'Bobo-Dioulasso', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Artiste peintre. Je cherche ma muse.', 'jean_i', 'female'),
(13, 'Ibrahim', 'Sore', 'ibrahim@test.com', '70000013', p_hash, 'male', '2000-01-13', 'Ouagadougou', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400', 'Fan de foot et de soirées entre potes.', 'ibrahim_s', 'female'),
(14, 'Paul', 'Yaméogo', 'paul@test.com', '70000014', p_hash, 'male', '1992-05-30', 'Koudougou', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'Professeur. J''aime les discussions intellectuelles.', 'paul_y', 'female'),
(15, 'Karim', 'Bila', 'karim@test.com', '70000015', p_hash, 'male', '2002-12-05', 'Ouagadougou', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400', 'Étudiant en droit. Futur avocat.', 'karim_b', 'female'),
(16, 'Abdoulaye', 'Cisse', 'abdou@test.com', '70000016', p_hash, 'male', '1999-03-22', 'Tenkodogo', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', 'Agriculteur moderne. La terre ne ment pas.', 'abdou_c', 'female'),
(17, 'Ismael', 'Maiga', 'ismael@test.com', '70000017', p_hash, 'male', '1996-08-01', 'Ouagadougou', 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400', 'Photographe freelance. Je capture les beaux moments.', 'ismael_m', 'female'),
(18, 'David', 'Thiombiano', 'david@test.com', '70000018', p_hash, 'male', '2001-07-29', 'Fada N''Gourma', 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=400', 'Sportif de haut niveau.', 'david_t', 'female'),
(19, 'Rodrigue', 'Nikiema', 'rod@test.com', '70000019', p_hash, 'male', '1994-04-14', 'Ouagadougou', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400', 'Chef cuisinier. Je saurai réveiller tes papilles.', 'rod_n', 'female'),
(20, 'Hassan', 'Tall', 'hassan@test.com', '70000020', p_hash, 'male', '1997-01-20', 'Dori', 'https://images.unsplash.com/photo-1520341280432-4749d4d7bcf9?w=400', 'Voyageur et rêveur.', 'hassan_t', 'female');

-- 2.2. Insertion des tags pour chaque utilisateur (Liaison)
INSERT INTO user_interests (user_id, interest_id) VALUES
-- Les sous-requêtes sont toujours valides, car elles sont exécutées à la fin du bloc.
(1, (SELECT interest_id FROM interests WHERE name = 'Technologie')), (1, (SELECT interest_id FROM interests WHERE name = 'Cinéma')), (1, (SELECT interest_id FROM interests WHERE name = 'Voyage')),
(2, (SELECT interest_id FROM interests WHERE name = 'Art')), (2, (SELECT interest_id FROM interests WHERE name = 'Musique')), (2, (SELECT interest_id FROM interests WHERE name = 'Théâtre')),
(3, (SELECT interest_id FROM interests WHERE name = 'Mode')), (3, (SELECT interest_id FROM interests WHERE name = 'Coup d''un soir')), (3, (SELECT interest_id FROM interests WHERE name = 'Danse')),
(4, (SELECT interest_id FROM interests WHERE name = 'Musique')), (4, (SELECT interest_id FROM interests WHERE name = 'Danse')), (4, (SELECT interest_id FROM interests WHERE name = 'Sport')),
(5, (SELECT interest_id FROM interests WHERE name = 'Cuisine')), (5, (SELECT interest_id FROM interests WHERE name = 'Nature')), (5, (SELECT interest_id FROM interests WHERE name = 'Animaux')),
(6, (SELECT interest_id FROM interests WHERE name = 'Voyage')), (6, (SELECT interest_id FROM interests WHERE name = 'Jeux')), (6, (SELECT interest_id FROM interests WHERE name = 'sexefriend')),
(7, (SELECT interest_id FROM interests WHERE name = 'Nature')), (7, (SELECT interest_id FROM interests WHERE name = 'Photographie')), (7, (SELECT interest_id FROM interests WHERE name = 'Voyage')),
(8, (SELECT interest_id FROM interests WHERE name = 'Cinéma')), (8, (SELECT interest_id FROM interests WHERE name = 'Musique')), (8, (SELECT interest_id FROM interests WHERE name = 'Mode')),
(9, (SELECT interest_id FROM interests WHERE name = 'Art')), (9, (SELECT interest_id FROM interests WHERE name = 'Technologie')), (9, (SELECT interest_id FROM interests WHERE name = 'Cuisine')),
(10, (SELECT interest_id FROM interests WHERE name = 'Musique')), (10, (SELECT interest_id FROM interests WHERE name = 'Cuisine')), (10, (SELECT interest_id FROM interests WHERE name = 'sexefriend')),
(11, (SELECT interest_id FROM interests WHERE name = 'Sport')), (11, (SELECT interest_id FROM interests WHERE name = 'Voyage')), (11, (SELECT interest_id FROM interests WHERE name = 'Cinéma')),
(12, (SELECT interest_id FROM interests WHERE name = 'Art')), (12, (SELECT interest_id FROM interests WHERE name = 'Musique')), (12, (SELECT interest_id FROM interests WHERE name = 'Théâtre')),
(13, (SELECT interest_id FROM interests WHERE name = 'Sport')), (13, (SELECT interest_id FROM interests WHERE name = 'Jeux')), (13, (SELECT interest_id FROM interests WHERE name = 'Coup d''un soir')),
(14, (SELECT interest_id FROM interests WHERE name = 'Lecture')), (14, (SELECT interest_id FROM interests WHERE name = 'Voyage')), (14, (SELECT interest_id FROM interests WHERE name = 'Technologie')),
(15, (SELECT interest_id FROM interests WHERE name = 'Technologie')), (15, (SELECT interest_id FROM interests WHERE name = 'Cinéma')), (15, (SELECT interest_id FROM interests WHERE name = 'Musique')),
(16, (SELECT interest_id FROM interests WHERE name = 'Nature')), (16, (SELECT interest_id FROM interests WHERE name = 'Cuisine')), (16, (SELECT interest_id FROM interests WHERE name = 'Animaux')),
(17, (SELECT interest_id FROM interests WHERE name = 'Photographie')), (17, (SELECT interest_id FROM interests WHERE name = 'Art')), (17, (SELECT interest_id FROM interests WHERE name = 'Voyage')),
(18, (SELECT interest_id FROM interests WHERE name = 'Sport')), (18, (SELECT interest_id FROM interests WHERE name = 'Nature')), (18, (SELECT interest_id FROM interests WHERE name = 'Jeux')),
(19, (SELECT interest_id FROM interests WHERE name = 'Cuisine')), (19, (SELECT interest_id FROM interests WHERE name = 'Musique')), (19, (SELECT interest_id FROM interests WHERE name = 'Danse')),
(20, (SELECT interest_id FROM interests WHERE name = 'Voyage')), (20, (SELECT interest_id FROM interests WHERE name = 'Art')), (20, (SELECT interest_id FROM interests WHERE name = 'Coup d''un soir'));
 
    -- 4. Réinitialiser la séquence pour éviter les conflits d'ID
    PERFORM setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

END $$;