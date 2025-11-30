package com.lovematch.dao;

import com.lovematch.models.User;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MatchDAO {
    private final DataSource dataSource;

    public MatchDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // Envoyer un Like (Demande de match)
    public boolean sendLike(Long likerId, Long likedId) {
        String sql = "INSERT INTO user_likes (liker_id, liked_user_id, is_like) VALUES (?, ?, true) " +
                    "ON CONFLICT (liker_id, liked_user_id) DO UPDATE SET is_like = true, liked_at = CURRENT_TIMESTAMP";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, likerId);
            stmt.setLong(2, likedId);
            
            int rows = stmt.executeUpdate();
            return rows > 0;
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de l'envoi du like", e);
        }
    }

    // Supprimer un Like (Refuser une demande)
    public boolean removeLike(Long likerId, Long likedId) {
        String sql = "DELETE FROM user_likes WHERE liker_id = ? AND liked_user_id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, likerId);
            stmt.setLong(2, likedId);
            
            int rows = stmt.executeUpdate();
            return rows > 0;
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la suppression du like", e);
        }
    }

    // Vérifier si c'est un match (Like réciproque)
    public boolean checkMatch(Long user1Id, Long user2Id) {
        String sql = "SELECT COUNT(*) FROM user_likes " +
                    "WHERE (liker_id = ? AND liked_user_id = ? AND is_like = true) " +
                    "OR (liker_id = ? AND liked_user_id = ? AND is_like = true)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, user1Id);
            stmt.setLong(2, user2Id);
            stmt.setLong(3, user2Id);
            stmt.setLong(4, user1Id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) == 2; // Si les 2 ont liké
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }



    // Vérifier si une demande existe déjà (dans un sens ou l'autre) ou s'ils sont déjà matchés
    public boolean hasExistingRequest(Long user1Id, Long user2Id) {
        String sql = "SELECT COUNT(*) FROM user_likes WHERE (liker_id = ? AND liked_user_id = ?) OR (liker_id = ? AND liked_user_id = ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, user1Id);
            stmt.setLong(2, user2Id);
            stmt.setLong(3, user2Id);
            stmt.setLong(4, user1Id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Créer le match officiellement
    public void createMatch(Long user1Id, Long user2Id) {
        // On s'assure que user1Id < user2Id pour l'unicité (contrainte CHECK)
        long firstId = Math.min(user1Id, user2Id);
        long secondId = Math.max(user1Id, user2Id);

        String sql = "INSERT INTO matches (user1_id, user2_id) VALUES (?, ?) ON CONFLICT DO NOTHING";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, firstId);
            stmt.setLong(2, secondId);
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la création du match", e);
        }
    }

    // Récupérer les demandes en attente (Ceux qui m'ont liké, mais que je n'ai pas encore liké/disliké)
    public List<User> getPendingRequests(Long userId) {
        List<User> requests = new ArrayList<>();
        // Sélectionne les utilisateurs qui ont liké 'userId'
        // SAUF ceux que 'userId' a déjà liké ou disliké (répondu)
        String sql = "SELECT u.* FROM users u " +
                    "JOIN user_likes ul ON u.user_id = ul.liker_id " +
                    "WHERE ul.liked_user_id = ? AND ul.is_like = true " +
                    "AND u.user_id NOT IN (SELECT liked_user_id FROM user_likes WHERE liker_id = ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.setLong(2, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    requests.add(mapUserFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return requests;
    }

    // Récupérer les demandes envoyées (Likes que j'ai faits, mais pas encore matchés)
    public List<User> getSentRequests(Long userId) {
        List<User> sentRequests = new ArrayList<>();
        String sql = "SELECT u.* FROM users u " +
                    "JOIN user_likes ul ON u.user_id = ul.liked_user_id " +
                    "WHERE ul.liker_id = ? AND ul.is_like = true " +
                    "AND u.user_id NOT IN (SELECT liker_id FROM user_likes WHERE liked_user_id = ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.setLong(2, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    sentRequests.add(mapUserFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return sentRequests;
    }

    // Récupérer mes matchs confirmés
    public List<User> getMatches(Long userId) {
        List<User> matches = new ArrayList<>();
        String sql = "SELECT u.* FROM users u " +
                    "JOIN matches m ON (u.user_id = m.user1_id OR u.user_id = m.user2_id) " +
                    "WHERE (m.user1_id = ? OR m.user2_id = ?) AND u.user_id != ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.setLong(2, userId);
            stmt.setLong(3, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    matches.add(mapUserFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return matches;
    }

    // Helper (Dupliqué de UserDAO pour simplicité ici, idéalement à refactoriser)
    private User mapUserFromResultSet(ResultSet rs) throws SQLException {
        User user = new User();
        user.setUserId(rs.getLong("user_id"));
        user.setUsername(rs.getString("username"));
        user.setFirstName(rs.getString("first_name"));
        user.setLastName(rs.getString("last_name"));
        user.setProfilePictureUrl(rs.getString("profile_picture_url"));
        user.setCity(rs.getString("city"));
        user.setGender(rs.getString("gender"));
        // On ne charge pas tout pour les listes légères
        return user;
    }
}
