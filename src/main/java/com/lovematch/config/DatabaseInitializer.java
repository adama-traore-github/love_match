package com.lovematch.config;

import org.postgresql.ds.PGSimpleDataSource;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

@WebListener
public class DatabaseInitializer implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            PGSimpleDataSource dataSource = new PGSimpleDataSource();
            dataSource.setServerName("localhost");
            dataSource.setDatabaseName("lovematch");
            dataSource.setUser("nostra");
            dataSource.setPassword("nostra");

            ServletContext context = sce.getServletContext();
            context.setAttribute("dataSource", dataSource);
            
            System.out.println("=== Database connection initialized successfully ===");
        } catch (Exception e) {
            System.err.println("=== Error initializing database connection ===");
            e.printStackTrace();
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // Cleanup if necessary
    }
}
