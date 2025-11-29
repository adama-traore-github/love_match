package com.lovematch.dao;

import com.lovematch.models.User;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public class UserDAO {
    private final DataSource dataSource;

    public UserDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ? AND is_active = true";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapUserFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche de l'utilisateur par email: " + email, e);
        }
        return null;
    }

    public User findById(Long userId) {
        String sql = "SELECT * FROM users WHERE user_id = ? AND is_active = true";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapUserFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche de l'utilisateur ID: " + userId, e);
        }
        return null;
    }

    public void create(User user) {
        String sql = "INSERT INTO users (username, email, password_hash, first_name, last_name, " +
                    "date_of_birth, gender, city, search_preference, bio, profile_picture_url, phone_number) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING user_id";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPasswordHash());
            stmt.setString(4, user.getFirstName());
            stmt.setString(5, user.getLastName());
            stmt.setDate(6, user.getDateOfBirth() != null ? Date.valueOf(user.getDateOfBirth()) : null);
            stmt.setString(7, user.getGender());
            stmt.setString(8, user.getCity());
            stmt.setString(9, user.getSearchPreference());
            stmt.setString(10, user.getBio());
            stmt.setString(11, user.getProfilePictureUrl());
            stmt.setString(12, user.getPhoneNumber());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    user.setUserId(rs.getLong("user_id"));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la création de l'utilisateur", e);
        }
    }

    public void update(User user) {
        System.out.println("[UserDAO] Updating user: " + user.getUserId());
        String sql = "UPDATE users SET first_name = ?, last_name = ?, city = ?, bio = ?, " +
                    "phone_number = ?, search_preference = ?, gender = ?, email = ? WHERE user_id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getFirstName());
            stmt.setString(2, user.getLastName());
            stmt.setString(3, user.getCity());
            stmt.setString(4, user.getBio());
            stmt.setString(5, user.getPhoneNumber());
            stmt.setString(6, user.getSearchPreference());
            stmt.setString(7, user.getGender());
            stmt.setString(8, user.getEmail());
            stmt.setLong(9, user.getUserId());

            int rows = stmt.executeUpdate();
            System.out.println("[UserDAO] Update executed, rows affected: " + rows);
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la mise à jour de l'utilisateur ID: " + user.getUserId(), e);
        }
    }

    public void updateInterests(Long userId, Set<String> interests) {
        String deleteSql = "DELETE FROM user_interests WHERE user_id = ?";
        String insertSql = "INSERT INTO user_interests (user_id, interest_id) " +
                          "SELECT ?, interest_id FROM interests WHERE name = ?";
        String insertInterestSql = "INSERT INTO interests (name) VALUES (?) ON CONFLICT (name) DO NOTHING";

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Supprimer les anciens intérêts
                try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                    deleteStmt.setLong(1, userId);
                    deleteStmt.executeUpdate();
                }

                // 2. Ajouter les nouveaux
                if (interests != null && !interests.isEmpty()) {
                    try (PreparedStatement insertInterestStmt = conn.prepareStatement(insertInterestSql);
                         PreparedStatement linkStmt = conn.prepareStatement(insertSql)) {
                        
                        for (String interest : interests) {
                            if (interest == null || interest.trim().isEmpty()) continue;
                            String cleanInterest = interest.trim();

                            // S'assurer que l'intérêt existe
                            insertInterestStmt.setString(1, cleanInterest);
                            insertInterestStmt.executeUpdate();

                            // Lier l'utilisateur à l'intérêt
                            linkStmt.setLong(1, userId);
                            linkStmt.setString(2, cleanInterest);
                            linkStmt.executeUpdate();
                        }
                    }
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la mise à jour des intérêts pour l'utilisateur ID: " + userId, e);
        }
    }

    public List<String> getAllInterests() {
        List<String> interests = new ArrayList<>();
        String sql = "SELECT name FROM interests ORDER BY name";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                interests.add(rs.getString("name"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return interests;
    }

    public void updateProfilePicture(Long userId, String profilePictureUrl) {
        String sql = "UPDATE users SET profile_picture_url = ? WHERE user_id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, profilePictureUrl);
            stmt.setLong(2, userId);
            
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la mise à jour de la photo de profil", e);
        }
    }

    private Set<String> loadInterests(Long userId) {
        Set<String> interests = new HashSet<>();
        String sql = "SELECT i.name FROM interests i " +
                    "JOIN user_interests ui ON i.interest_id = ui.interest_id " +
                    "WHERE ui.user_id = ?";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    interests.add(rs.getString("name"));
                }
            }
        } catch (SQLException e) {
            // On log mais on ne bloque pas le chargement du user
            e.printStackTrace();
        }
        return interests;
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
        
        // Charger les intérêts
        user.setInterests(loadInterests(user.getUserId()));
        
        return user;
    }
}
