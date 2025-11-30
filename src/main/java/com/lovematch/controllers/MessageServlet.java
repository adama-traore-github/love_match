package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lovematch.dao.MessageDAO;
import com.lovematch.models.Message;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/messages/*")
@javax.servlet.annotation.MultipartConfig(
    fileSizeThreshold = 1024 * 1024 * 2, // 2MB
    maxFileSize = 1024 * 1024 * 50,      // 50MB
    maxRequestSize = 1024 * 1024 * 100   // 100MB
)
public class MessageServlet extends HttpServlet {
    private MessageDAO messageDAO;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void init() throws ServletException {
        DataSource dataSource = (DataSource) getServletContext().getAttribute("dataSource");
        this.messageDAO = new MessageDAO(dataSource);
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        System.out.println("[MessageServlet] doPost called");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            System.out.println("[MessageServlet] Unauthorized access attempt");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Long currentUserId = (Long) session.getAttribute("userId");
        String pathInfo = request.getPathInfo();
        System.out.println("[MessageServlet] User: " + currentUserId + ", Path: " + pathInfo);

        try {
            if ("/send".equals(pathInfo)) {
                // Vérifier si c'est une requête multipart
                if (request.getContentType() != null && request.getContentType().toLowerCase().startsWith("multipart/")) {
                    System.out.println("[MessageServlet] Handling multipart request");
                    // Gestion de l'upload
                    Long receiverId = Long.valueOf(request.getParameter("receiverId"));
                    String content = request.getParameter("content");
                    if (content == null) content = "";

                    String attachmentUrl = null;
                    String attachmentType = null;

                    javax.servlet.http.Part filePart = request.getPart("file");
                    if (filePart != null && filePart.getSize() > 0) {
                        String fileName = getFileName(filePart);
                        System.out.println("[MessageServlet] File uploaded: " + fileName);
                        if (fileName != null && !fileName.isEmpty()) {
                            String fileExt = fileName.substring(fileName.lastIndexOf("."));
                            String newFileName = "chat_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID() + fileExt;
                            
                            String uploadPath = getServletContext().getRealPath("") + java.io.File.separator + "uploads" + java.io.File.separator + "chat";
                            java.io.File uploadDir = new java.io.File(uploadPath);
                            if (!uploadDir.exists()) uploadDir.mkdirs();
                            
                            filePart.write(uploadPath + java.io.File.separator + newFileName);
                            attachmentUrl = "uploads/chat/" + newFileName;
                            
                            // Déterminer le type
                            String mimeType = filePart.getContentType();
                            if (mimeType.startsWith("image/")) attachmentType = "image";
                            else if (mimeType.startsWith("video/")) attachmentType = "video";
                            else attachmentType = "document";
                            System.out.println("[MessageServlet] File saved at: " + attachmentUrl + " (Type: " + attachmentType + ")");
                        }
                    }

                    if ((content.trim().isEmpty()) && attachmentUrl == null) {
                        System.out.println("[MessageServlet] Empty message rejected");
                        response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Message vide");
                        return;
                    }

                    messageDAO.saveMessage(currentUserId, receiverId, content, attachmentUrl, attachmentType);
                    System.out.println("[MessageServlet] Message saved to DB");
                    response.getWriter().write("{\"success\":true}");

                } else {
                    System.out.println("[MessageServlet] Handling JSON request");
                    // Gestion JSON classique (rétrocompatibilité si besoin, ou pour messages texte simples)
                    Map<String, Object> body = objectMapper.readValue(request.getInputStream(), Map.class);
                    Long receiverId = Long.valueOf(String.valueOf(body.get("receiverId")));
                    String content = (String) body.get("content");

                    if (content == null || content.trim().isEmpty()) {
                        System.out.println("[MessageServlet] Empty JSON message rejected");
                        response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Message vide");
                        return;
                    }

                    messageDAO.saveMessage(currentUserId, receiverId, content, null, null);
                    System.out.println("[MessageServlet] JSON Message saved to DB");
                    response.getWriter().write("{\"success\":true}");
                }
            }
        } catch (Exception e) {
            System.err.println("[MessageServlet] Error processing request:");
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileName(javax.servlet.http.Part part) {
        for (String content : part.getHeader("content-disposition").split(";")) {
            if (content.trim().startsWith("filename")) {
                return content.substring(content.indexOf('=') + 1).trim().replace("\"", "");
            }
        }
        return null;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Long currentUserId = (Long) session.getAttribute("userId");
        String pathInfo = request.getPathInfo();

        try {
            if ("/conversation".equals(pathInfo)) {
                String otherUserIdStr = request.getParameter("userId");
                if (otherUserIdStr != null) {
                    Long otherUserId = Long.valueOf(otherUserIdStr);
                    List<Message> messages = messageDAO.getConversation(currentUserId, otherUserId);
                    response.getWriter().write(objectMapper.writeValueAsString(messages));
                }

            } else if ("/unread-count".equals(pathInfo)) {
                int count = messageDAO.countUnreadMessages(currentUserId);
                Map<String, Object> result = new HashMap<>();
                result.put("count", count);
                response.getWriter().write(objectMapper.writeValueAsString(result));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
