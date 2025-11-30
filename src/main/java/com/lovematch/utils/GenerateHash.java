package com.lovematch.utils;

import org.mindrot.jbcrypt.BCrypt;

public class GenerateHash {
    public static void main(String[] args) {
        String password = "password123";
        String hash = BCrypt.hashpw(password, BCrypt.gensalt());
        System.out.println("New Hash: " + hash);
    }
}
