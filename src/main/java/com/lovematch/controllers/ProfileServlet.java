package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lovematch.dao.ProfileDAO;
import com.lovematch.models.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;
import java.io.IOException;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@WebServlet("/api/profiles/*")
public class ProfileServlet extends HttpServlet {
    private ProfileDAO profileDAO;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void init() throws ServletException {
        DataSource dataSource = (DataSource) getServletContext().getAttribute("dataSource");
        this.profileDAO = new ProfileDAO(dataSource);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String pathInfo = request.getPathInfo();
            
            if (pathInfo == null || pathInfo.equals("/")) {
                // Récupérer tous les profils
                List<Map<String, Object>> profiles = profileDAO.findAll().stream()
                        .map(this::convertToMap)
                        .collect(Collectors.toList());
                
                response.getWriter().write(objectMapper.writeValueAsString(profiles));
            } else {
                // Vérifier si c'est une requête pour les correspondances potentielles
                String[] pathParts = pathInfo.split("/");
                if (pathParts.length >= 3 && "matches".equals(pathParts[2])) {
                    // Récupérer les correspondances potentielles
                    Long userId = Long.parseLong(pathParts[1]);
                    String genderPreference = request.getParameter("gender");
                    
                    List<Map<String, Object>> matches = profileDAO
                            .findPotentialMatches(userId, genderPreference)
                            .stream()
                            .map(this::convertToMap)
                            .collect(Collectors.toList());
                    
                    response.getWriter().write(objectMapper.writeValueAsString(matches));
                } else {
                    // Récupérer un profil spécifique
                    try {
                        Long userId = Long.parseLong(pathParts[1]);
                        profileDAO.findById(userId).ifPresentOrElse(
                            user -> {
                                try {
                                    response.getWriter().write(objectMapper.writeValueAsString(convertToMap(user)));
                                } catch (IOException e) {
                                    sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                                            "Erreur lors de la sérialisation du profil");
                                }
                            },
                            () -> sendError(response, HttpServletResponse.SC_NOT_FOUND, "Profil non trouvé")
                        );
                    } catch (NumberFormatException e) {
                        sendError(response, HttpServletResponse.SC_BAD_REQUEST, "ID de profil invalide");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Erreur interne du serveur");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Vérifier l'authentification
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Non autorisé");
            return;
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Action non spécifiée");
            return;
        }

        try {
            String[] pathParts = pathInfo.split("/");
            if (pathParts.length < 3) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "URL invalide");
                return;
            }

            Long targetUserId = Long.parseLong(pathParts[1]);
            String action = pathParts[2];
            User currentUser = (User) session.getAttribute("user");

            if ("like".equalsIgnoreCase(action)) {
                handleLikeAction(currentUser.getUserId(), targetUserId, response);
            } else if ("dislike".equalsIgnoreCase(action)) {
                handleDislikeAction(currentUser.getUserId(), targetUserId, response);
            } else {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Action non supportée: " + action);
            }
        } catch (NumberFormatException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, "ID de profil invalide");
        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Erreur lors du traitement de la demande");
        }
    }

    private void handleLikeAction(Long likerId, Long likedUserId, HttpServletResponse response) 
            throws IOException {
        try {
            // Enregistrer le like
            profileDAO.likeUser(likerId, likedUserId);
            
            // Vérifier si c'est un match
            boolean isMatch = profileDAO.checkForMatch(likerId, likedUserId);
            
            if (isMatch) {
                // Créer un match
                profileDAO.createMatch(likerId, likedUserId);
                
                // Récupérer les informations de l'autre utilisateur pour la notification
                User matchedUser = profileDAO.findById(likedUserId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                
                // Réponse avec les informations du match
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("match", true);
                responseData.put("matchedUser", convertToMap(matchedUser));
                
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(responseData));
            } else {
                // Réponse standard de like sans match
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("match", false);
                
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(responseData));
            }
        } catch (Exception e) {
            throw new IOException("Erreur lors du traitement du like", e);
        }
    }

    private void handleDislikeAction(Long userId, Long dislikedUserId, HttpServletResponse response) 
            throws IOException {
        try {
            // Pour l'instant, on ne fait que renvoyer une réponse de succès
            // Vous pourriez implémenter la logique de dislike ici si nécessaire
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            
            response.setContentType("application/json");
            response.getWriter().write(objectMapper.writeValueAsString(responseData));
        } catch (Exception e) {
            throw new IOException("Erreur lors du traitement du dislike", e);
        }
    }

    private Map<String, Object> convertToMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", user.getUserId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("firstName", user.getFirstName());
        map.put("lastName", user.getLastName());
        map.put("fullName", user.getFullName());
        
        if (user.getDateOfBirth() != null) {
            map.put("age", user.getAge());
            map.put("dateOfBirth", user.getDateOfBirth().toString());
        }
        
        map.put("gender", user.getGender());
        map.put("city", user.getCity());
        map.put("searchPreference", user.getSearchPreference());
        map.put("bio", user.getBio() != null ? user.getBio() : "");
        map.put("profilePictureUrl", user.getProfilePictureUrl());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("interests", user.getInterests());
        
        return map;
    }

    private void sendError(HttpServletResponse response, int status, String message) {
        try {
            response.setStatus(status);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"" + message + "\"}");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}