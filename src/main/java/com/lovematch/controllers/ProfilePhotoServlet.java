package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lovematch.dao.UserDAO;
import com.lovematch.models.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/profiles/photo")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024 * 2, // 2MB
    maxFileSize = 1024 * 1024 * 10,      // 10MB
    maxRequestSize = 1024 * 1024 * 50    // 50MB
)
public class ProfilePhotoServlet extends HttpServlet {
    private UserDAO userDAO;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void init() throws ServletException {
        DataSource dataSource = (DataSource) getServletContext().getAttribute("dataSource");
        this.userDAO = new UserDAO(dataSource);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Vérifier l'authentification
        HttpSession session = request.getSession(false);
        User currentUser = null;
        
        if (session != null) {
            currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                Long userId = (Long) session.getAttribute("userId");
                if (userId != null) {
                    currentUser = userDAO.findById(userId);
                }
            }
        }

        if (currentUser == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Non autorisé");
            return;
        }

        try {
            Part filePart = request.getPart("photo");
            if (filePart == null || filePart.getSize() == 0) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Aucun fichier envoyé");
                return;
            }

            String fileName = getFileName(filePart);
            if (fileName == null || fileName.isEmpty()) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Nom de fichier invalide");
                return;
            }
            String fileExt = fileName.substring(fileName.lastIndexOf("."));
            String newFileName = "user_" + currentUser.getUserId() + "_" + UUID.randomUUID() + fileExt;

            // Dossier de destination
            String uploadPath = getServletContext().getRealPath("") + File.separator + "uploads";
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) uploadDir.mkdir();

            // Sauvegarder le fichier
            String filePath = uploadPath + File.separator + newFileName;
            filePart.write(filePath);

            // URL publique
            String photoUrl = "uploads/" + newFileName;

            // Mettre à jour la BDD
            userDAO.updateProfilePicture(currentUser.getUserId(), photoUrl);
            
            // Mettre à jour la session
            currentUser.setProfilePictureUrl(photoUrl);
            session.setAttribute("user", currentUser);

            // Réponse
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("profilePictureUrl", photoUrl);

            response.setContentType("application/json");
            response.getWriter().write(objectMapper.writeValueAsString(responseData));

        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Erreur lors de l'upload");
        }
    }

    private String getFileName(Part part) {
        for (String content : part.getHeader("content-disposition").split(";")) {
            if (content.trim().startsWith("filename")) {
                return content.substring(content.indexOf('=') + 1).trim().replace("\"", "");
            }
        }
        return null;
    }
}
