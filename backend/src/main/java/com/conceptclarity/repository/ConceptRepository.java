package com.conceptclarity.repository;

import com.conceptclarity.model.Concept;
import com.conceptclarity.model.Concept.ExplanationLevel;
import com.conceptclarity.model.Concept.ExplanationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * JPA Repository for Concept entities.
 * Spring Data auto-generates SQL implementations for these method signatures.
 */
@Repository
public interface ConceptRepository extends JpaRepository<Concept, Long> {

    /**
     * Find all concepts ordered by creation time (newest first) with pagination.
     */
    Page<Concept> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find concepts by session ID for user-specific history.
     */
    List<Concept> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    /**
     * Search concepts by topic (case-insensitive, partial match).
     */
    @Query("SELECT c FROM Concept c WHERE LOWER(c.topic) LIKE LOWER(CONCAT('%', :topic, '%')) ORDER BY c.createdAt DESC")
    List<Concept> findByTopicContainingIgnoreCase(@Param("topic") String topic);

    /**
     * Find recent successful concepts (for trending/suggestions).
     */
    @Query("SELECT c FROM Concept c WHERE c.success = true AND c.createdAt >= :since ORDER BY c.createdAt DESC")
    List<Concept> findRecentSuccessful(@Param("since") LocalDateTime since, Pageable pageable);

    /**
     * Count concepts by level for analytics.
     */
    long countByLevel(ExplanationLevel level);

    /**
     * Count concepts by type for analytics.
     */
    long countByType(ExplanationType type);

    /**
     * Find exact match (topic + level + type) to avoid duplicate AI calls.
     * Returns most recent matching concept.
     */
    @Query("SELECT c FROM Concept c WHERE LOWER(c.topic) = LOWER(:topic) AND c.level = :level AND c.type = :type AND c.success = true ORDER BY c.createdAt DESC")
    List<Concept> findExactMatch(
        @Param("topic") String topic,
        @Param("level") ExplanationLevel level,
        @Param("type") ExplanationType type,
        Pageable pageable
    );
}
