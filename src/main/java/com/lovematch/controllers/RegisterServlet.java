package com.lovematch.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lovematch.dao.UserDAO;
import com.lovematch.models.User;
import org.mindrot.jbcrypt.BCrypt;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;

@WebServlet("/api/register")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024 * 2, // 2MB
    maxFileSize = 1024 * 1024 * 10,      // 10MB
    maxRequestSize = 1024 * 1024 * 50    // 50MB
)
public class RegisterServlet extends HttpServlet {
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

        try {
            // 1. Récupération des champs
            String email = request.getParameter("email");
            String password = request.getParameter("password");
            String firstName = request.getParameter("firstName");
            String lastName = request.getParameter("lastName");
            String phone = request.getParameter("phone");
            String city = request.getParameter("city");
            String gender = request.getParameter("gender");
            String dobStr = request.getParameter("birthDate"); // Format YYYY-MM-DD
            
            // Validation basique
            if (email == null || password == null || firstName == null || lastName == null) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Champs obligatoires manquants");
                return;
            }

            // Vérifier si l'email existe déjà
            if (userDAO.findByEmail(email) != null) {
                sendError(response, HttpServletResponse.SC_CONFLICT, "Cet email est déjà utilisé");
                return;
            }

            // 2. Gestion de la photo
            String profilePictureUrl = "https://via.placeholder.com/150"; // Par défaut
            Part filePart = request.getPart("profilePhoto");
            if (filePart != null && filePart.getSize() > 0) {
                String fileName = getFileName(filePart);
                if (fileName != null && !fileName.isEmpty()) {
                    String fileExt = fileName.substring(fileName.lastIndexOf("."));
                    String newFileName = "user_" + System.currentTimeMillis() + "_" + UUID.randomUUID() + fileExt;
                    
                    String uploadPath = getServletContext().getRealPath("") + File.separator + "uploads";
                    File uploadDir = new File(uploadPath);
                    if (!uploadDir.exists()) uploadDir.mkdir();
                    
                    filePart.write(uploadPath + File.separator + newFileName);
                    profilePictureUrl = "uploads/" + newFileName;
                }
            }

            // 3. Création de l'utilisateur
            User user = new User();
            user.setEmail(email);
            user.setPasswordHash(BCrypt.hashpw(password, BCrypt.gensalt()));
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhoneNumber(phone);
            user.setCity(city);
            user.setGender(gender);
            user.setProfilePictureUrl(profilePictureUrl);
            user.setUsername(firstName.toLowerCase() + "_" + lastName.toLowerCase().charAt(0) + new Random().nextInt(1000));
            user.setSearchPreference("both"); // Par défaut

            if (dobStr != null && !dobStr.isEmpty()) {
                user.setDateOfBirth(LocalDate.parse(dobStr));
            }

            // Sauvegarde en base
            userDAO.create(user);

            // 4. Gestion des intérêts
            String[] interests = request.getParameterValues("interests");
            if (interests != null && interests.length > 0) {
                Set<String> interestSet = new HashSet<>(Arrays.asList(interests));
                userDAO.updateInterests(user.getUserId(), interestSet);
            }

            // 5. Réponse succès
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("userId", user.getUserId());
            responseData.put("message", "Inscription réussie");

            response.getWriter().write(objectMapper.writeValueAsString(responseData));

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Erreur lors de l'inscription: " + e.getMessage());
        }
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.getWriter().write("{\"error\":\"" + message + "\"}");
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
