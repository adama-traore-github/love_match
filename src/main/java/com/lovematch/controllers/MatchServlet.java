package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lovematch.dao.MatchDAO;
import com.lovematch.models.User;

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

@WebServlet("/api/matches/*")
public class MatchServlet extends HttpServlet {
    private MatchDAO matchDAO;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void init() throws ServletException {
        DataSource dataSource = (DataSource) getServletContext().getAttribute("dataSource");
        this.matchDAO = new MatchDAO(dataSource);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
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
            if ("/request".equals(pathInfo)) {
                // Envoyer une demande (Like)
                Map<String, Object> body = objectMapper.readValue(request.getInputStream(), Map.class);
                Long targetId = Long.valueOf(String.valueOf(body.get("targetId")));
                
                boolean success = matchDAO.sendLike(currentUserId, targetId);
                
                // Vérifier si c'est un match immédiat
                boolean isMatch = matchDAO.checkMatch(currentUserId, targetId);
                if (isMatch) {
                    matchDAO.createMatch(currentUserId, targetId);
                }

                Map<String, Object> result = new HashMap<>();
                result.put("success", success);
                result.put("isMatch", isMatch);
                response.getWriter().write(objectMapper.writeValueAsString(result));

            } else if ("/accept".equals(pathInfo)) {
                // Accepter une demande (Like en retour)
                Map<String, Object> body = objectMapper.readValue(request.getInputStream(), Map.class);
                Long targetId = Long.valueOf(String.valueOf(body.get("targetId")));

                matchDAO.sendLike(currentUserId, targetId);
                matchDAO.createMatch(currentUserId, targetId);

                response.getWriter().write("{\"success\":true, \"message\":\"Match created\"}");

            } else if ("/reject".equals(pathInfo)) {
                // Refuser une demande (Supprimer le like entrant)
                Map<String, Object> body = objectMapper.readValue(request.getInputStream(), Map.class);
                Long targetId = Long.valueOf(String.valueOf(body.get("targetId")));

                // Note: Dans une demande, c'est l'autre (targetId) qui a liké le currentUserId
                // Donc on supprime le like où liker = targetId et liked = currentUserId
                boolean success = matchDAO.removeLike(targetId, currentUserId);

                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", success);
                response.getWriter().write(objectMapper.writeValueAsString(responseData));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
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
            if ("/requests".equals(pathInfo)) {
                // Liste des demandes en attente
                List<User> requests = matchDAO.getPendingRequests(currentUserId);
                response.getWriter().write(objectMapper.writeValueAsString(requests));

            } else if ("/sent".equals(pathInfo)) {
                // Liste des demandes envoyées
                List<User> sent = matchDAO.getSentRequests(currentUserId);
                response.getWriter().write(objectMapper.writeValueAsString(sent));

            } else if ("/list".equals(pathInfo)) {
                // Liste des matchs confirmés
                List<User> matches = matchDAO.getMatches(currentUserId);
                response.getWriter().write(objectMapper.writeValueAsString(matches));

            } else if ("/check-status".equals(pathInfo)) {
                // Vérifier le statut avec un utilisateur spécifique
                String targetIdStr = request.getParameter("targetId");
                if (targetIdStr != null) {
                    Long targetId = Long.valueOf(targetIdStr);
                    boolean hasRequest = matchDAO.hasExistingRequest(currentUserId, targetId);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("hasRequest", hasRequest);
                    response.getWriter().write(objectMapper.writeValueAsString(result));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
