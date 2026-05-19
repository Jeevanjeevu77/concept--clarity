package com.conceptclarity.controller;

import com.conceptclarity.dto.ConceptDTO.ExplainRequest;
import com.conceptclarity.dto.ConceptDTO.ExplainResponse;
import com.conceptclarity.dto.ConceptDTO.HistoryItem;
import com.conceptclarity.service.ConceptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for the Concept Clarity API.
 *
 * All endpoints are prefixed with /api/v1
 * CORS is handled globally via WebConfig.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class ConceptController {

    private final ConceptService conceptService;

    // ─── Core Explain Endpoint ────────────────────────────────────────────────

    /**
     * POST /api/v1/explain
     *
     * Main endpoint. Accepts a concept explanation request and returns
     * a structured AI-generated response.
     *
     * Request Body:
     * {
     *   "topic": "Machine Learning",
     *   "level": "BEGINNER",
     *   "type": "DEFINITION",
     *   "sessionId": "optional-session-id"
     * }
     *
     * Response:
     * {
     *   "id": 1,
     *   "topic": "Machine Learning",
     *   "shortExplanation": "...",
     *   "detailedExplanation": "...",
     *   "example": "...",
     *   "analogy": "...",
     *   "summary": "...",
     *   "relatedTopics": ["Deep Learning", "Neural Networks", ...]
     * }
     */
    @PostMapping("/explain")
    public ResponseEntity<ExplainResponse> explain(@Valid @RequestBody ExplainRequest request) {
        log.info("POST /explain | Topic: '{}' | Level: {} | Type: {}",
            request.getTopic(), request.getLevel(), request.getType());

        ExplainResponse response = conceptService.explain(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            // Return 422 Unprocessable Entity for AI failures (request was valid, processing failed)
            return ResponseEntity.unprocessableEntity().body(response);
        }
    }

    // ─── History Endpoints ────────────────────────────────────────────────────

    /**
     * GET /api/v1/history?page=0&size=20
     *
     * Returns paginated history of all concept queries.
     */
    @GetMapping("/history")
    public ResponseEntity<List<HistoryItem>> getHistory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /history | page={}, size={}", page, size);
        // Cap max page size to prevent abuse
        int cappedSize = Math.min(size, 100);
        return ResponseEntity.ok(conceptService.getHistory(page, cappedSize));
    }

    /**
     * GET /api/v1/history/{id}
     *
     * Returns the full explanation for a specific history entry.
     */
    @GetMapping("/history/{id}")
    public ResponseEntity<ExplainResponse> getHistoryById(@PathVariable Long id) {
        log.debug("GET /history/{}", id);
        return conceptService.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/history/session/{sessionId}
     *
     * Returns history filtered by session (for user-specific history).
     */
    @GetMapping("/history/session/{sessionId}")
    public ResponseEntity<List<HistoryItem>> getSessionHistory(@PathVariable String sessionId) {
        log.debug("GET /history/session/{}", sessionId);
        return ResponseEntity.ok(conceptService.getSessionHistory(sessionId));
    }

    /**
     * GET /api/v1/history/search?q=keyword
     *
     * Searches history by topic keyword.
     */
    @GetMapping("/history/search")
    public ResponseEntity<List<HistoryItem>> searchHistory(@RequestParam("q") String keyword) {
        log.debug("GET /history/search?q={}", keyword);
        if (keyword == null || keyword.trim().length() < 2) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(conceptService.searchHistory(keyword.trim()));
    }

    // ─── Health Check ─────────────────────────────────────────────────────────

    /**
     * GET /api/v1/health
     *
     * Simple health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Concept Clarity API",
            "version", "1.0.0"
        ));
    }
}
