package com.lovematch.dao;

import com.lovematch.models.Message;
import com.lovematch.models.User;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MessageDAO {
    private final DataSource dataSource;

    public MessageDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // Sauvegarder un message
    public void saveMessage(Long senderId, Long receiverId, String content, String attachmentUrl, String attachmentType) {
        String sql = "INSERT INTO messages (sender_id, receiver_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, senderId);
            stmt.setLong(2, receiverId);
            stmt.setString(3, content);
            stmt.setString(4, attachmentUrl);
            stmt.setString(5, attachmentType);
            
            stmt.executeUpdate();
            
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de l'envoi du message", e);
        }
    }

    // Récupérer la conversation entre deux utilisateurs
    public List<Message> getConversation(Long user1Id, Long user2Id) {
        List<Message> messages = new ArrayList<>();
        String sql = "SELECT * FROM messages " +
                    "WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) " +
                    "ORDER BY sent_at ASC";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, user1Id);
            stmt.setLong(2, user2Id);
            stmt.setLong(3, user2Id);
            stmt.setLong(4, user1Id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Message msg = new Message();
                    msg.setMessageId(rs.getLong("message_id"));
                    msg.setSenderId(rs.getLong("sender_id"));
                    msg.setReceiverId(rs.getLong("receiver_id"));
                    msg.setContent(rs.getString("content"));
                    msg.setSentAt(rs.getTimestamp("sent_at").toLocalDateTime());
                    msg.setRead(rs.getBoolean("is_read"));
                    msg.setAttachmentUrl(rs.getString("attachment_url"));
                    msg.setAttachmentType(rs.getString("attachment_type"));
                    
                    messages.add(msg);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return messages;
    }

    // Compter les messages non lus pour un utilisateur
    public int countUnreadMessages(Long userId) {
        String sql = "SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = false";
        
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
}
