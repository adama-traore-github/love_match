package com.lovematch.dao;

import com.lovematch.models.User;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

public class ProfileDAO {
    private final DataSource dataSource;

    public ProfileDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public List<User> findAll() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT * FROM users WHERE is_active = true";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                User user = mapUserFromResultSet(rs);
                loadUserInterests(user);
                users.add(user);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la récupération des utilisateurs", e);
        }
        return users;
    }

    public Optional<User> findById(Long userId) {
        String sql = "SELECT * FROM users WHERE user_id = ? AND is_active = true";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User user = mapUserFromResultSet(rs);
                    loadUserInterests(user);
                    return Optional.of(user);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche de l'utilisateur ID: " + userId, e);
        }
    }

    private User mapUserFromResultSet(ResultSet rs) throws SQLException {
        User user = new User();
        user.setUserId(rs.getLong("user_id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setFirstName(rs.getString("first_name"));
        user.setLastName(rs.getString("last_name"));
        
        Date dob = rs.getDate("date_of_birth");
        user.setDateOfBirth(dob != null ? dob.toLocalDate() : null);
        
        user.setGender(rs.getString("gender"));
        user.setCity(rs.getString("city"));
        user.setSearchPreference(rs.getString("search_preference"));
        user.setBio(rs.getString("bio"));
        user.setProfilePictureUrl(rs.getString("profile_picture_url"));
        user.setPhoneNumber(rs.getString("phone_number"));
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        user.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        
        Timestamp lastLogin = rs.getTimestamp("last_login");
        user.setLastLogin(lastLogin != null ? lastLogin.toLocalDateTime() : null);
        
        user.setActive(rs.getBoolean("is_active"));
        
        return user;
    }

    private void loadUserInterests(User user) throws SQLException {
        String sql = "SELECT i.name FROM interests i " +
                    "JOIN user_interests ui ON i.interest_id = ui.interest_id " +
                    "WHERE ui.user_id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, user.getUserId());
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    user.addInterest(rs.getString("name"));
                }
            }
        }
    }

    public List<User> findPotentialMatches(Long userId, String genderPreference) {
        List<User> matches = new ArrayList<>();
        String sql = "SELECT u.* FROM users u " +
                    "WHERE u.user_id != ? " +
                    "AND u.is_active = true " +
                    "AND u.gender = ? " +
                    "AND NOT EXISTS (" +
                    "    SELECT 1 FROM user_likes ul " +
                    "    WHERE (ul.liker_id = ? AND ul.liked_user_id = u.user_id)" +
                    ") " +
                    "ORDER BY u.created_at DESC";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, userId);
            stmt.setString(2, genderPreference);
            stmt.setLong(3, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    User user = mapUserFromResultSet(rs);
                    loadUserInterests(user);
                    matches.add(user);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche des correspondances potentielles", e);
        }
        return matches;
    }

    public boolean likeUser(Long likerId, Long likedUserId) {
        String sql = "INSERT INTO user_likes (liker_id, liked_user_id, is_like) VALUES (?, ?, true) " +
                    "ON CONFLICT (liker_id, liked_user_id) DO UPDATE SET is_like = true";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, likerId);
            stmt.setLong(2, likedUserId);
            
            int updated = stmt.executeUpdate();
            return updated > 0;
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du like", e);
        }
    }
    
    public boolean checkForMatch(Long user1Id, Long user2Id) {
        String sql = "SELECT 1 FROM user_likes " +
                    "WHERE liker_id = ? AND liked_user_id = ? AND is_like = true";
                    
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, user2Id);
            stmt.setLong(2, user1Id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next(); // Si une ligne est retournée, c'est un match
            }
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la vérification du match", e);
        }
    }
    
    public void createMatch(Long user1Id, Long user2Id) {
        String sql = "INSERT INTO matches (user1_id, user2_id) VALUES (?, ?) " +
                    "ON CONFLICT (user1_id, user2_id) DO NOTHING";
                    
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            // S'assurer que user1Id est toujours le plus petit pour éviter les doublons
            Long smallerId = Math.min(user1Id, user2Id);
            Long largerId = Math.max(user1Id, user2Id);
            
            stmt.setLong(1, smallerId);
            stmt.setLong(2, largerId);
            
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la création du match", e);
        }
    }
}
