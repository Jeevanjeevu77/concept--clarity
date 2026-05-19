package com.conceptclarity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Service responsible for calling the Groq AI API.
 *
 * Groq uses an OpenAI-compatible REST API, so the request/response format
 * follows the standard OpenAI Chat Completions schema.
 *
 * Free tier: No credit card required. Sign up at console.groq.com
 * Limits: 30 req/min, 6000 tokens/min, 1000 req/day (plenty for dev/personal use)
 *
 * Docs: https://console.groq.com/docs/openai
 */
@Service
@Slf4j
public class AiApiService {

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.model}")
    private String model;

    @Value("${ai.api.max-tokens}")
    private int maxTokens;

    @Value("${ai.api.timeout-seconds}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper;

    // Reuse HttpClient across requests (thread-safe)
    private final HttpClient httpClient;

    public AiApiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    }

    /**
     * Sends a prompt to the Groq API and returns the raw text response.
     *
     * @param prompt The formatted prompt to send
     * @return Raw text content from AI
     * @throws AiApiException if the API call fails
     */
    public String callAiApi(String prompt) throws AiApiException {
        log.info("Calling Groq API | model: {}", model);

        try {
            // Build OpenAI-compatible request body
            ObjectNode requestBody = buildRequestBody(prompt);
            String requestJson = objectMapper.writeValueAsString(requestBody);

            // Build HTTP request — Groq uses Bearer token auth (same as OpenAI)
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)   // Groq auth header
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

            log.debug("Sending request to Groq API...");

            // Execute the request synchronously
            HttpResponse<String> response = httpClient.send(
                httpRequest,
                HttpResponse.BodyHandlers.ofString()
            );

            log.info("Groq API responded with status: {}", response.statusCode());

            // Handle rate limiting (429) with a helpful message
            if (response.statusCode() == 429) {
                log.warn("Groq rate limit hit: {}", response.body());
                throw new AiApiException(
                    "Rate limit reached on free tier (30 req/min). " +
                    "Please wait a moment and try again, or upgrade at console.groq.com"
                );
            }

            // Handle other non-2xx responses
            if (response.statusCode() != 200) {
                log.error("Groq API error response [{}]: {}", response.statusCode(), response.body());
                throw new AiApiException(
                    "Groq API returned status: " + response.statusCode() +
                    " | " + parseErrorMessage(response.body())
                );
            }

            // Parse and return the text content
            return extractTextContent(response.body());

        } catch (AiApiException e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Groq API request timed out after {}s", timeoutSeconds);
            throw new AiApiException("Request timed out. Please try again.", e);
        } catch (Exception e) {
            log.error("Unexpected error calling Groq API: {}", e.getMessage(), e);
            throw new AiApiException("Failed to call Groq AI service: " + e.getMessage(), e);
        }
    }

    /**
     * Builds the OpenAI-compatible Chat Completions request body.
     *
     * Groq accepts the exact same format as OpenAI:
     * POST https://api.groq.com/openai/v1/chat/completions
     * {
     *   "model": "llama-3.3-70b-versatile",
     *   "messages": [
     *     { "role": "system", "content": "..." },
     *     { "role": "user",   "content": "..." }
     *   ],
     *   "max_tokens": 2048
     * }
     */
    private ObjectNode buildRequestBody(String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", maxTokens);

        // Lower temperature = more focused, consistent JSON output
        body.put("temperature", 0.7);

        ArrayNode messages = objectMapper.createArrayNode();

        // System message — instructs the model to return strict JSON
        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content",
            "You are a structured educational assistant. " +
            "Always respond with valid JSON only. " +
            "Never include markdown code blocks (no ```json), " +
            "preambles, or any text outside the JSON object itself."
        );
        messages.add(systemMsg);

        // User message with the full explanation prompt
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", prompt);
        messages.add(userMsg);

        body.set("messages", messages);
        return body;
    }

    /**
     * Extracts the text content from Groq's OpenAI-compatible response.
     *
     * Response structure:
     * {
     *   "choices": [{
     *     "message": { "role": "assistant", "content": "..." }
     *   }]
     * }
     */
    private String extractTextContent(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);

        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            String content = choices.get(0)
                .path("message")
                .path("content")
                .asText();

            if (content != null && !content.isBlank()) {
                log.debug("Extracted Groq response ({} chars)", content.length());
                return content;
            }
        }

        // Surface any API-level error message
        if (root.has("error")) {
            String errorMsg = root.path("error").path("message").asText("Unknown Groq error");
            throw new AiApiException("Groq API error: " + errorMsg);
        }

        throw new AiApiException("Unexpected response format from Groq: " + responseBody);
    }

    /**
     * Tries to extract a human-readable error message from a non-200 response body.
     */
    private String parseErrorMessage(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            return root.path("error").path("message").asText(body);
        } catch (Exception e) {
            return body;
        }
    }

    /**
     * Custom exception for AI API failures.
     */
    public static class AiApiException extends Exception {
        public AiApiException(String message) {
            super(message);
        }

        public AiApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
