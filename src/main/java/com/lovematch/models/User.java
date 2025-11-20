package com.lovematch.models;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public class User {
    private Long userId;
    private String username;
    private String email;
    private String passwordHash;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String city;
    private String searchPreference = "female";
    private String bio;
    private String profilePictureUrl;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private boolean isActive = true;
    private Set<String> interests = new HashSet<>();

    // Getters et Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getSearchPreference() { return searchPreference; }
    public void setSearchPreference(String searchPreference) { 
        this.searchPreference = searchPreference != null ? searchPreference : "female"; 
    }
    
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    
    public String getProfilePictureUrl() { 
        return profilePictureUrl != null ? profilePictureUrl : "https://via.placeholder.com/300x400?text=Photo+de+profil";
    }
    public void setProfilePictureUrl(String profilePictureUrl) { 
        this.profilePictureUrl = profilePictureUrl; 
    }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public Set<String> getInterests() { return interests; }
    public void setInterests(Set<String> interests) { 
        this.interests = interests != null ? interests : new HashSet<>(); 
    }
    
    public void addInterest(String interest) {
        if (interest != null && !interest.trim().isEmpty()) {
            this.interests.add(interest.trim());
        }
    }
    
    // Méthodes utilitaires
    public String getFullName() {
        return (firstName != null ? firstName + " " : "") + (lastName != null ? lastName : "").trim();
    }
    
    public Integer getAge() {
        if (dateOfBirth == null) return null;
        return LocalDate.now().getYear() - dateOfBirth.getYear();
    }
}