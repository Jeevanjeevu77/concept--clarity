package com.conceptclarity.dto;

import com.conceptclarity.model.Concept.ExplanationLevel;
import com.conceptclarity.model.Concept.ExplanationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs (Data Transfer Objects) for the Concept Clarity API.
 * Separates API contracts from internal domain models.
 */
public class ConceptDTO {

    // ─── Request DTO ─────────────────────────────────────────────────────────

    /**
     * Incoming request payload for concept explanation.
     */
    @Data
    public static class ExplainRequest {

        @NotBlank(message = "Topic cannot be empty")
        @Size(min = 2, max = 300, message = "Topic must be between 2 and 300 characters")
        private String topic;

        @NotNull(message = "Explanation level is required")
        private ExplanationLevel level;

        @NotNull(message = "Explanation type is required")
        private ExplanationType type;

        /** Optional session ID for grouping history */
        private String sessionId;
    }

    // ─── Response DTO ────────────────────────────────────────────────────────

    /**
     * Structured AI explanation response returned to the frontend.
     */
    @Data
    public static class ExplainResponse {

        /** Database ID for referencing in history */
        private Long id;

        /** The original topic requested */
        private String topic;

        /** Level and type echo back for frontend convenience */
        private ExplanationLevel level;
        private ExplanationType type;

        /** 2–3 line short explanation shown by default */
        private String shortExplanation;

        /** Full detailed explanation (shown in "Read More") */
        private String detailedExplanation;

        /** Concrete example illustrating the concept */
        private String example;

        /** Simple analogy – only for BEGINNER/INTERMEDIATE */
        private String analogy;

        /** TL;DR summary of the concept */
        private String summary;

        /** List of related topics for further exploration */
        private List<String> relatedTopics;

        /** Timestamp of the explanation */
        private LocalDateTime createdAt;

        /** Whether the AI call succeeded */
        private boolean success;

        /** Error message if something went wrong */
        private String errorMessage;
    }

    // ─── History DTO ─────────────────────────────────────────────────────────

    /**
     * Lightweight DTO for history list items (avoids sending full response).
     */
    @Data
    public static class HistoryItem {
        private Long id;
        private String topic;
        private ExplanationLevel level;
        private ExplanationType type;
        private LocalDateTime createdAt;
        private boolean success;
    }
}
