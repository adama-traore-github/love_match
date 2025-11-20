package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lovematch.dao.UserDAO;
import com.lovematch.models.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import javax.sql.DataSource;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/auth/*")
public class AuthController extends HttpServlet {
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
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            switch (pathInfo) {
                case "/login":
                    handleLogin(request, response);
                    break;
                case "/logout":
                    handleLogout(request, response);
                    break;
                case "/check":
                    handleCheckAuth(request, response);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Une erreur est survenue\"}");
        }
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        // Lire les données de la requête
        Map<String, String> credentials = objectMapper.readValue(
                request.getInputStream(), 
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class)
        );

        String email = credentials.get("email");
        String password = credentials.get("password");
        boolean rememberMe = Boolean.parseBoolean(credentials.get("rememberMe"));

        if (email == null || password == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"message\":\"Email et mot de passe requis\"}");
            return;
        }

        try {
            // Vérifier les identifiants
            User user = userDAO.findByEmail(email);
            
            if (user == null || !user.getPasswordHash().equals(password)) { // À remplacer par une vérification sécurisée du mot de passe
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"message\":\"Email ou mot de passe incorrect\"}");
                return;
            }

            // Créer un token de session
            String token = UUID.randomUUID().toString();
            
            // Stocker le token en session
            HttpSession session = request.getSession();
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("token", token);
            
            // Configurer le cookie si "Se souvenir de moi" est coché
            if (rememberMe) {
                Cookie tokenCookie = new Cookie("auth_token", token);
                tokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 jours
                tokenCookie.setHttpOnly(true);
                tokenCookie.setPath("/");
                response.addCookie(tokenCookie);
            }

            // Préparer la réponse
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getUserId());
            userData.put("email", user.getEmail());
            userData.put("username", user.getUsername());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("gender", user.getGender());
            
            responseData.put("user", userData);

            // Envoyer la réponse
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(objectMapper.writeValueAsString(responseData));
            
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"message\":\"Erreur lors de l'authentification\"}");
        }
    }

    private void handleLogout(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        // Invalider la session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        
        // Supprimer le cookie d'authentification
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("auth_token")) {
                    cookie.setValue("");
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }
        
        // Répondre avec succès
        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write("{\"message\":\"Déconnexion réussie\"}");
    }

    private void handleCheckAuth(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        HttpSession session = request.getSession(false);
        Map<String, Object> responseData = new HashMap<>();
        
        if (session != null && session.getAttribute("userId") != null) {
            Long userId = (Long) session.getAttribute("userId");
            try {
                User user = userDAO.findById(userId);
                if (user != null) {
                    responseData.put("authenticated", true);
                    
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getUserId());
                    userData.put("email", user.getEmail());
                    userData.put("username", user.getUsername());
                    userData.put("firstName", user.getFirstName());
                    userData.put("lastName", user.getLastName());
                    userData.put("gender", user.getGender());
                    
                    responseData.put("user", userData);
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.getWriter().write(objectMapper.writeValueAsString(responseData));
                    return;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        // Si on arrive ici, l'utilisateur n'est pas authentifié
        responseData.put("authenticated", false);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(objectMapper.writeValueAsString(responseData));
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if ("/check".equals(pathInfo)) {
            handleCheckAuth(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
}
