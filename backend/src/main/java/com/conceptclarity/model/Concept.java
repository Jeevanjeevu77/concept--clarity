package com.conceptclarity.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a concept explanation request and its AI-generated response.
 * Stored in MySQL for history and analytics.
 */
@Entity
@Table(name = "concepts", indexes = {
    @Index(name = "idx_topic", columnList = "topic"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Concept {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The concept/topic the user wants explained (e.g., "Quantum Entanglement")
     */
    @Column(nullable = false, length = 500)
    private String topic;

    /**
     * Explanation level: BEGINNER, INTERMEDIATE, ADVANCED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExplanationLevel level;

    /**
     * Explanation type: DEFINITION, DETAILED, STEP_BY_STEP
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExplanationType type;

    /**
     * Full JSON response from AI (stored as TEXT for flexibility)
     */
    @Column(columnDefinition = "TEXT")
    private String response;

    /**
     * The AI prompt that was generated (useful for debugging)
     */
    @Column(columnDefinition = "TEXT")
    private String prompt;

    /**
     * Timestamp when this query was created
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Session ID to group user sessions (optional, for analytics)
     */
    @Column(length = 100)
    private String sessionId;

    /**
     * Whether the response was successful
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean success = true;

    /**
     * Auto-set creation timestamp before persisting
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // ─── Nested Enums ────────────────────────────────────────────────────────

    public enum ExplanationLevel {
        BEGINNER, INTERMEDIATE, ADVANCED
    }

    public enum ExplanationType {
        DEFINITION, DETAILED, STEP_BY_STEP
    }
}
