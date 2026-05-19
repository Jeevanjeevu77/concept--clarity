package com.conceptclarity;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Main entry point for the Concept Clarity Spring Boot application.
 * This application provides AI-powered structured concept explanations.
 */
@SpringBootApplication
public class ConceptClarityApplication {

    public static void main(String[] args) {
        // Determine .env directory: check backend/ first, then current dir
        String envDir = Files.exists(Paths.get("backend/.env")) ? "backend" : ".";

        // Load environment variables from .env file (if it exists)
        Dotenv dotenv = Dotenv.configure()
                .directory(envDir)
                .ignoreIfMissing()
                .load();

        // Export each variable to System Properties so Spring can find them
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(ConceptClarityApplication.class, args);
    }
}

