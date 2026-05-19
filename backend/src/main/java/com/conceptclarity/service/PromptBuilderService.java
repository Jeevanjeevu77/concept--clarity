package com.conceptclarity.service;

import com.conceptclarity.model.Concept.ExplanationLevel;
import com.conceptclarity.model.Concept.ExplanationType;
import org.springframework.stereotype.Service;

/**
 * Builds structured prompts for the AI model.
 *
 * The prompt engineering here is critical — it instructs the AI to return
 * a strict JSON format so we can parse and display each section separately.
 */
@Service
public class PromptBuilderService {

    /**
     * Builds a comprehensive, structured prompt for the AI.
     *
     * @param topic  The concept the user wants explained
     * @param level  BEGINNER / INTERMEDIATE / ADVANCED
     * @param type   DEFINITION / DETAILED / STEP_BY_STEP
     * @return Fully formatted prompt string
     */
    public String buildPrompt(String topic, ExplanationLevel level, ExplanationType type) {

        String levelContext = buildLevelContext(level);
        String typeContext = buildTypeContext(type);
        boolean includeAnalogy = (level == ExplanationLevel.BEGINNER || level == ExplanationLevel.INTERMEDIATE);

        return String.format("""
            You are an expert educator with the ability to explain complex concepts clearly to any audience.
            
            Explain the concept: "%s"
            
            Target Audience: %s
            Explanation Style: %s
            
            IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation outside JSON.
            
            Return this exact JSON structure:
            {
              "shortExplanation": "A clear 2-3 sentence explanation suitable for the target audience. This is shown first.",
              "detailedExplanation": "%s",
              "example": "A concrete, relatable real-world example that illustrates the concept clearly.",
              "analogy": %s,
              "summary": "A concise 1-2 sentence TL;DR that captures the essence of the concept.",
              "relatedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
            }
            
            Guidelines:
            - shortExplanation: %s
            - detailedExplanation: %s  
            - example: Make it concrete and easy to visualize
            - analogy: %s
            - summary: The single most important takeaway
            - relatedTopics: 4-6 genuinely related concepts worth exploring next
            
            Ensure all JSON values are properly escaped strings. Do not include any text outside the JSON object.
            """,
            topic,
            levelContext,
            typeContext,
            buildDetailedInstructions(type),
            includeAnalogy ? "\"A simple, intuitive analogy that connects this concept to everyday life\"" : "null",
            buildShortExplanationGuidance(level),
            buildDetailedGuidance(level, type),
            includeAnalogy
                ? "Use a simple metaphor from everyday life (cooking, sports, household items, etc.)"
                : "null (not needed for advanced audience)"
        );
    }

    /**
     * Builds audience context for the given level.
     */
    private String buildLevelContext(ExplanationLevel level) {
        return switch (level) {
            case BEGINNER -> "Complete beginner with no prior knowledge. Use simple language, avoid jargon, " +
                             "and relate everything to everyday experiences.";
            case INTERMEDIATE -> "Someone with basic familiarity who wants deeper understanding. " +
                                 "Can handle some technical terms if explained. Focus on 'why' not just 'what'.";
            case ADVANCED -> "Expert or professional who wants precise, technically accurate information. " +
                             "Use proper terminology, discuss nuances, edge cases, and trade-offs.";
        };
    }

    /**
     * Builds style context for the given type.
     */
    private String buildTypeContext(ExplanationType type) {
        return switch (type) {
            case DEFINITION -> "Conceptual Definition — focus on what the concept IS, its core meaning, " +
                               "key characteristics, and how it's formally understood.";
            case DETAILED -> "Detailed Explanation — go deep. Cover the concept comprehensively, " +
                             "including mechanisms, causes, effects, history if relevant, and nuances.";
            case STEP_BY_STEP -> "Step-by-Step Breakdown — explain how the concept works as a process or sequence. " +
                                  "Break it into clear numbered steps or phases.";
        };
    }

    /**
     * Instructions for the detailed explanation field based on type.
     */
    private String buildDetailedInstructions(ExplanationType type) {
        return switch (type) {
            case DEFINITION -> "A thorough definition covering key properties, characteristics, and how it differs from related concepts. 3-5 sentences.";
            case DETAILED -> "A comprehensive explanation covering mechanisms, how it works, why it matters, and important nuances. 5-8 sentences.";
            case STEP_BY_STEP -> "A numbered step-by-step breakdown. Use \\n1. Step one\\n2. Step two format. Include 4-7 clear steps.";
        };
    }

    /**
     * Short explanation guidance tailored to level.
     */
    private String buildShortExplanationGuidance(ExplanationLevel level) {
        return switch (level) {
            case BEGINNER -> "Use simple everyday words. Imagine explaining to a curious 12-year-old.";
            case INTERMEDIATE -> "Balance simplicity with accuracy. Use some field-specific terms but define them briefly.";
            case ADVANCED -> "Be precise and technically accurate. Assume professional vocabulary.";
        };
    }

    /**
     * Detailed explanation guidance combining level and type.
     */
    private String buildDetailedGuidance(ExplanationLevel level, ExplanationType type) {
        if (type == ExplanationType.STEP_BY_STEP) {
            return switch (level) {
                case BEGINNER -> "Use simple numbered steps. Each step should be a single clear action. Avoid technical jargon.";
                case INTERMEDIATE -> "Break into logical phases. Can include some technical steps with brief clarifications.";
                case ADVANCED -> "Detailed technical steps including implementation specifics, edge cases, and best practices.";
            };
        }
        return switch (level) {
            case BEGINNER -> "Keep it simple. Use analogies and avoid technical jargon completely.";
            case INTERMEDIATE -> "Go deeper. Explain mechanisms and include technical vocabulary with brief definitions.";
            case ADVANCED -> "Be comprehensive and precise. Cover technical details, trade-offs, and advanced nuances.";
        };
    }
}
