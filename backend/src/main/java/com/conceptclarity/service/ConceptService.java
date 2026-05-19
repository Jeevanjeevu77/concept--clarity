package com.conceptclarity.service;

import com.conceptclarity.dto.ConceptDTO;
import com.conceptclarity.dto.ConceptDTO.ExplainRequest;
import com.conceptclarity.dto.ConceptDTO.ExplainResponse;
import com.conceptclarity.dto.ConceptDTO.HistoryItem;
import com.conceptclarity.model.Concept;
import com.conceptclarity.model.Concept.ExplanationLevel;
import com.conceptclarity.model.Concept.ExplanationType;
import com.conceptclarity.repository.ConceptRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Core business logic service for concept explanations.
 *
 * Orchestrates:
 * 1. Cache check (avoid duplicate AI calls for same topic+level+type)
 * 2. Prompt building
 * 3. AI API call
 * 4. Response parsing
 * 5. Persistence to database
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConceptService {

    private final ConceptRepository conceptRepository;
    private final PromptBuilderService promptBuilderService;
    private final AiApiService aiApiService;
    private final ObjectMapper objectMapper;

    // ─── Explain ─────────────────────────────────────────────────────────────

    /**
     * Main entry point: explains a concept using AI.
     *
     * @param request Validated request from controller
     * @return Structured explanation response
     */
    @Transactional
    public ExplainResponse explain(ExplainRequest request) {
        String topic = request.getTopic().trim();
        ExplanationLevel level = request.getLevel();
        ExplanationType type = request.getType();

        log.info("Explaining concept: '{}' | Level: {} | Type: {}", topic, level, type);

        // 1. Check if we have a cached response (same topic+level+type within 24 hours)
        Optional<Concept> cached = findCachedResponse(topic, level, type);
        if (cached.isPresent()) {
            log.info("Cache hit for topic: '{}'", topic);
            return buildResponseFromEntity(cached.get());
        }

        // 2. Build the AI prompt
        String prompt = promptBuilderService.buildPrompt(topic, level, type);
        log.debug("Generated prompt ({} chars)", prompt.length());

        // 3. Call AI API
        String aiRawResponse;
        boolean success = true;
        String errorMessage = null;

        try {
            aiRawResponse = aiApiService.callAiApi(prompt);
        } catch (AiApiService.AiApiException e) {
            log.error("AI API call failed for topic '{}': {}", topic, e.getMessage());
            success = false;
            aiRawResponse = null;
            errorMessage = e.getMessage();
        }

        // 4. Parse AI response into structured DTO
        ExplainResponse response;
        if (success && aiRawResponse != null) {
            response = parseAiResponse(aiRawResponse, topic, level, type);
        } else {
            response = buildErrorResponse(topic, level, type, errorMessage);
        }

        // 5. Persist to database
        Concept entity = Concept.builder()
            .topic(topic)
            .level(level)
            .type(type)
            .prompt(prompt)
            .response(aiRawResponse)
            .sessionId(request.getSessionId())
            .success(success)
            .createdAt(LocalDateTime.now())
            .build();

        Concept saved = conceptRepository.save(entity);
        response.setId(saved.getId());
        response.setCreatedAt(saved.getCreatedAt());

        log.info("Explanation saved with ID: {}", saved.getId());
        return response;
    }

    // ─── History ─────────────────────────────────────────────────────────────

    /**
     * Returns paginated history of all concept queries.
     */
    @Transactional(readOnly = true)
    public List<HistoryItem> getHistory(int page, int size) {
        Page<Concept> conceptPage = conceptRepository
            .findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));

        return conceptPage.getContent().stream()
            .map(this::toHistoryItem)
            .collect(Collectors.toList());
    }

    /**
     * Returns history filtered by session ID.
     */
    @Transactional(readOnly = true)
    public List<HistoryItem> getSessionHistory(String sessionId) {
        return conceptRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)
            .stream()
            .map(this::toHistoryItem)
            .collect(Collectors.toList());
    }

    /**
     * Retrieves a full explanation by ID (for re-displaying from history).
     */
    @Transactional(readOnly = true)
    public Optional<ExplainResponse> getById(Long id) {
        return conceptRepository.findById(id)
            .map(this::buildResponseFromEntity);
    }

    /**
     * Searches history by topic keyword.
     */
    @Transactional(readOnly = true)
    public List<HistoryItem> searchHistory(String keyword) {
        return conceptRepository.findByTopicContainingIgnoreCase(keyword)
            .stream()
            .map(this::toHistoryItem)
            .collect(Collectors.toList());
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Checks for a cached response (same topic+level+type, successful, within 24 hours).
     * Avoids unnecessary AI API calls for repeated queries.
     */
    private Optional<Concept> findCachedResponse(String topic, ExplanationLevel level, ExplanationType type) {
        List<Concept> matches = conceptRepository.findExactMatch(
            topic, level, type, PageRequest.of(0, 1)
        );
        if (!matches.isEmpty()) {
            Concept cached = matches.get(0);
            // Only use cache if response is less than 24 hours old
            if (cached.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24))) {
                return Optional.of(cached);
            }
        }
        return Optional.empty();
    }

    /**
     * Parses the raw JSON string from AI into a structured ExplainResponse.
     */
    private ExplainResponse parseAiResponse(String rawJson, String topic,
                                             ExplanationLevel level, ExplanationType type) {
        ExplainResponse response = new ExplainResponse();
        response.setTopic(topic);
        response.setLevel(level);
        response.setType(type);
        response.setSuccess(true);

        try {
            // Strip markdown code blocks if AI ignored the instruction
            String cleanJson = rawJson
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

            JsonNode root = objectMapper.readTree(cleanJson);

            response.setShortExplanation(getTextOrDefault(root, "shortExplanation",
                "Explanation not available."));
            response.setDetailedExplanation(getTextOrDefault(root, "detailedExplanation", ""));
            response.setExample(getTextOrDefault(root, "example", ""));
            response.setSummary(getTextOrDefault(root, "summary", ""));

            // Analogy is only for beginner/intermediate
            if (!root.path("analogy").isNull() && !root.path("analogy").isMissingNode()) {
                response.setAnalogy(root.path("analogy").asText(null));
            }

            // Parse related topics array
            JsonNode topicsNode = root.path("relatedTopics");
            List<String> topics = new ArrayList<>();
            if (topicsNode.isArray()) {
                topicsNode.forEach(n -> topics.add(n.asText()));
            }
            response.setRelatedTopics(topics);

        } catch (Exception e) {
            log.error("Failed to parse AI JSON response: {}", e.getMessage());
            log.debug("Raw AI response: {}", rawJson);

            // Fallback: use the raw text as the explanation
            response.setShortExplanation(rawJson.length() > 500
                ? rawJson.substring(0, 500) + "..."
                : rawJson);
            response.setDetailedExplanation(rawJson);
            response.setRelatedTopics(new ArrayList<>());
        }

        return response;
    }

    /**
     * Builds a response from a persisted Concept entity (for history retrieval / cache).
     */
    private ExplainResponse buildResponseFromEntity(Concept entity) {
        if (entity.getResponse() == null || entity.getResponse().isBlank()) {
            return buildErrorResponse(entity.getTopic(), entity.getLevel(),
                entity.getType(), "No response stored");
        }
        ExplainResponse response = parseAiResponse(
            entity.getResponse(), entity.getTopic(), entity.getLevel(), entity.getType()
        );
        response.setId(entity.getId());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    /**
     * Builds an error response when the AI call fails.
     */
    private ExplainResponse buildErrorResponse(String topic, ExplanationLevel level,
                                                ExplanationType type, String errorMessage) {
        ExplainResponse response = new ExplainResponse();
        response.setTopic(topic);
        response.setLevel(level);
        response.setType(type);
        response.setSuccess(false);
        response.setErrorMessage("Unable to generate explanation: " + errorMessage);
        response.setShortExplanation("We couldn't generate an explanation at this time. Please try again.");
        response.setRelatedTopics(new ArrayList<>());
        response.setCreatedAt(LocalDateTime.now());
        return response;
    }

    /**
     * Maps a Concept entity to a lightweight HistoryItem DTO.
     */
    private HistoryItem toHistoryItem(Concept concept) {
        HistoryItem item = new HistoryItem();
        item.setId(concept.getId());
        item.setTopic(concept.getTopic());
        item.setLevel(concept.getLevel());
        item.setType(concept.getType());
        item.setCreatedAt(concept.getCreatedAt());
        item.setSuccess(concept.isSuccess());
        return item;
    }

    /**
     * Safely reads a text field from a JsonNode, returning a default if missing.
     */
    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode fieldNode = node.path(field);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return defaultValue;
        }
        return fieldNode.asText(defaultValue);
    }
}
