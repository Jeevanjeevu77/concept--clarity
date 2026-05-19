# 🎓 Concept Clarity — AI-Powered Learning Assistant

A full-stack application that explains any concept in a structured, adaptive way using Claude AI.

---

## 🏗️ Architecture Overview

```
concept-clarity/
├── backend/                  ← Spring Boot (Java 17)
│   └── src/main/java/com/conceptclarity/
│       ├── controller/       ← ConceptController.java
│       ├── service/          ← ConceptService, AiApiService, PromptBuilderService
│       ├── model/            ← Concept.java (JPA Entity)
│       ├── repository/       ← ConceptRepository.java (Spring Data JPA)
│       ├── dto/              ← ConceptDTO.java (Request/Response DTOs)
│       └── config/           ← WebConfig, GlobalExceptionHandler
├── frontend/                 ← React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/            ← HomePage, HistoryPage
│       ├── components/       ← ExplanationCard, LoadingSkeleton, Navbar
│       ├── services/         ← api.js (Axios)
│       └── context/          ← ThemeContext (dark mode)
└── database/
    └── setup.sql             ← MySQL schema
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Anthropic API Key | Required |

---

## 🚀 Quick Start

### Step 1 — Clone & enter project

```bash
cd concept-clarity
```

### Step 2 — MySQL Setup

```bash
mysql -u root -p < database/setup.sql
```

Or manually:
```sql
CREATE DATABASE concept_clarity CHARACTER SET utf8mb4;
```

### Step 3 — Configure Backend

Edit `backend/src/main/resources/application.properties` OR set environment variables:

```bash
# Required
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx

# Optional (defaults shown)
export DB_USERNAME=root
export DB_PASSWORD=password
```

### Step 4 — Start the Backend

```bash
cd backend
./mvnw spring-boot:run
# OR: mvn spring-boot:run
```

Backend starts on **http://localhost:8080**

Verify: `curl http://localhost:8080/api/v1/health`

### Step 5 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:3000**

---

## 📡 API Reference

### POST `/api/v1/explain`

Explains a concept using AI.

**Request:**
```json
{
  "topic": "Machine Learning",
  "level": "BEGINNER",
  "type": "DEFINITION",
  "sessionId": "optional-session-id"
}
```

**Valid values:**
- `level`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED`
- `type`: `DEFINITION` | `DETAILED` | `STEP_BY_STEP`

**Response (200 OK):**
```json
{
  "id": 42,
  "topic": "Machine Learning",
  "level": "BEGINNER",
  "type": "DEFINITION",
  "shortExplanation": "Machine Learning is a way of teaching computers to learn from examples instead of giving them explicit rules. Imagine showing a child thousands of cat photos until they can recognize a cat on their own — that's essentially what ML does for computers.",
  "detailedExplanation": "Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing computer programs that can access data and use it to learn for themselves...",
  "example": "Netflix recommending movies you'll like based on what you've watched before — the system learned your preferences from your viewing history without anyone manually programming 'if user likes action movies, suggest Die Hard'.",
  "analogy": "Think of it like training a dog. You don't explain the rules of 'sit' in detail — you reward the dog when it does the right thing, and over many repetitions, it learns. ML algorithms learn the same way, from rewards and examples.",
  "summary": "Machine Learning teaches computers to find patterns in data and make decisions, the way humans learn from experience.",
  "relatedTopics": ["Deep Learning", "Neural Networks", "Artificial Intelligence", "Data Science", "Natural Language Processing"],
  "createdAt": "2025-01-15T10:30:00",
  "success": true
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errorMessage": "Unable to generate explanation: Request timed out",
  "shortExplanation": "We couldn't generate an explanation at this time. Please try again."
}
```

---

### GET `/api/v1/history?page=0&size=20`

Returns paginated explanation history.

### GET `/api/v1/history/{id}`

Returns full explanation by ID.

### GET `/api/v1/history/session/{sessionId}`

Returns history for a specific user session.

### GET `/api/v1/history/search?q=keyword`

Searches history by topic keyword.

### GET `/api/v1/health`

Health check. Returns `{ "status": "UP" }`.

---

## 🌿 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | **Required.** Your Claude API key | — |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `password` |
| `YOUTUBE_API_KEY` | Optional YouTube integration | — |
| `UNSPLASH_API_KEY` | Optional image search | — |

---

## 🎨 Features

- ✅ **Adaptive explanations** — Beginner / Intermediate / Advanced
- ✅ **Three explanation styles** — Definition, Detailed, Step-by-Step
- ✅ **Structured output** — Short answer, full explanation, example, analogy, summary
- ✅ **Related topics** — Clickable for quick follow-up exploration
- ✅ **24-hour response caching** — Same query doesn't re-hit the AI API
- ✅ **History page** — Browse & search all previous explanations
- ✅ **Session history** — Filter to just your current session
- ✅ **Dark mode** — System preference detected, manually toggleable
- ✅ **Loading skeleton** — Smooth UX during AI generation
- ✅ **Toast notifications** — User-friendly error messages

---

## 🔧 Troubleshooting

**Backend won't start:**
- Check Java 17: `java -version`
- Check MySQL is running: `mysql -u root -p`
- Verify `ANTHROPIC_API_KEY` is set

**CORS errors in browser:**
- Make sure both backend (8080) and frontend (3000) are running
- The Vite proxy in `vite.config.js` forwards `/api` to `:8080`

**AI returns garbled JSON:**
- This is handled gracefully — the raw text is shown as the explanation
- Usually happens with very short or ambiguous topics

**"Connection refused" errors:**
- Backend: `curl http://localhost:8080/api/v1/health`
- Frontend proxy is configured in `vite.config.js`

---

## 📦 Production Build

```bash
# Build frontend
cd frontend && npm run build

# Copy dist/ to Spring Boot static resources
cp -r dist/* ../backend/src/main/resources/static/

# Build fat JAR
cd ../backend && mvn clean package -DskipTests

# Run
java -DANTHROPIC_API_KEY=sk-ant-... -jar target/concept-clarity-1.0.0.jar
```

---

## 🧪 Sample cURL Commands

```bash
# Explain a concept
curl -X POST http://localhost:8080/api/v1/explain \
  -H "Content-Type: application/json" \
  -d '{"topic":"Blockchain","level":"BEGINNER","type":"DEFINITION"}'

# Get history
curl http://localhost:8080/api/v1/history

# Search history
curl "http://localhost:8080/api/v1/history/search?q=machine"

# Health check
curl http://localhost:8080/api/v1/health
```
