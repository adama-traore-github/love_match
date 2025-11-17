package com.lovematch.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseUtil {
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/lovematch";
    private static final String DB_USER = "nostra";
    private static final String DB_PASSWORD = "nostra";
    
    private static Connection connection = null;
    
    public static Connection getConnection() {
        if (connection == null) {
            try {
                // Charger le pilote PostgreSQL
                Class.forName("org.postgresql.Driver");
                
                // Configuration de la connexion
                Properties props = new Properties();
                props.setProperty("user", DB_USER);
                props.setProperty("password", DB_PASSWORD);
                props.setProperty("ssl", "false");
                
                // Établir la connexion
                connection = DriverManager.getConnection(DB_URL, props);
                System.out.println("Connexion à la base de données établie avec succès.");
                
            } catch (ClassNotFoundException e) {
                System.err.println("Erreur: Pilote PostgreSQL non trouvé");
                e.printStackTrace();
            } catch (SQLException e) {
                System.err.println("Erreur lors de la connexion à la base de données");
                e.printStackTrace();
            }
        }
        return connection;
    }
    
    public static void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
                connection = null;
                System.out.println("Connexion à la base de données fermée.");
            } catch (SQLException e) {
                System.err.println("Erreur lors de la fermeture de la connexion");
                e.printStackTrace();
            }
        }
    }
}
