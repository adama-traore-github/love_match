package com.lovematch.dao;

import com.lovematch.models.User;

import javax.sql.DataSource;
import java.sql.*;

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
}
