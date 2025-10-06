# RAG Chat System - Full Architecture

## 🏗️ System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────────────┐               ┌──────────────────┐            │
│  │  WebSocket       │               │  SSE (Alt)       │            │
│  │  Client          │               │  Client          │            │
│  └────────┬─────────┘               └────────┬─────────┘            │
│           │                                  │                      │
└───────────┼──────────────────────────────────┼──────────────────────┘
            │                                  │
            │ ws://localhost:8080/ws/chat      │ POST /api/chat/stream
            │                                  │
┌───────────▼──────────────────────────────────▼──────────────────────┐
│              SPRING BOOT WEBFLUX GATEWAY (Port 8080)                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WebSocket Handler          │  REST Controller (SSE)        │    │
│  │  - Receive messages         │  - HTTP SSE endpoint          │    │
│  │  - Stream to client         │  - Alternative to WebSocket   │    │
│  └──────────────────┬──────────┴───────────┬───────────────────┘    │
│                     │                      │                        │
│                     └───────────┬──────────┘                        │
│                                 │                                   │
│                     ┌───────────▼───────────┐                       │
│                     │   ChatService         │                       │
│                     │   (WebFlux)           │                       │
│                     │   - Call LangChain    │                       │
│                     │   - Handle streaming  │                       │
│                     └───────────┬───────────┘                       │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  │ HTTP POST
                                  │ /chat (streaming)
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│         LANGCHAIN STREAMING SERVICE (Python - Port 8001)            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. Receive question                                         │   │
│  │  2. Call Haystack for document retrieval                     │   │
│  │  3. Stream AI response via LangChain                         │   │
│  └──────────────┬────────────────────────────┬──────────────────┘   │
│                 │                            │                      │
│                 │ POST /retrieve             │ Stream to OpenRouter │
│                 │                            │                      │
└─────────────────┼────────────────────────────┼──────────────────────┘
                  │                            │
     ┌────────────▼────────────┐  ┌────────────▼──────────────┐
     │  HAYSTACK RAG SERVICE   │  │  OpenRouter API           │
     │  (Python - Port 8000)   │  │  (GPT-3.5-turbo)          │
     │                         │  └───────────────────────────┘
     │  - Query reformulation  │
     │  - Document retrieval   │
     │  - Ranking              │
     └────────┬────────────────┘
              │
              │ Query documents
              │
     ┌────────▼────────────┐
     │  OpenSearch         │
     │  (Vector DB)        │
     │  - Document storage │
     │  - Hybrid search    │
     └─────────────────────┘
```

## 📊 Data Flow

### 1. User Query Flow
```
User Types Question
    ↓
React Component (WebSocket/SSE)
    ↓
Spring Boot WebFlux Gateway
    ↓
LangChain Service
    ↓
┌─────────────────────┐
│  Haystack Service   │ → Retrieve Documents from OpenSearch
│  (retrieval)        │ → Rank & Filter
└─────────────────────┘
    ↓
┌─────────────────────┐
│  LangChain Service  │ → Generate Answer with Context
│  (generation)       │ → Stream via OpenRouter
└─────────────────────┘
    ↓
Spring Boot WebFlux (Stream)
    ↓
React Frontend (Display streaming tokens)
```

### 2. Document Indexing Flow
```
MySQL Database
    ↓
Haystack Service (/index/mysql)
    ↓
Convert JSON rows to Documents
    ↓
Generate Embeddings
    ↓
Index to OpenSearch
```

## 🔧 Component Details

### Frontend (React)
- **WebSocket Client**: Real-time bidirectional communication
- **SSE Client**: Server-sent events (simpler, one-way)
- **UI**: Chat interface with streaming display

### Spring Boot Gateway (Port 8080)
- **Technology**: Spring WebFlux (Reactive)
- **Features**:
  - WebSocket Handler for real-time chat
  - REST Controller with SSE support
  - CORS configuration
  - Request/Response transformation
  - Error handling

### LangChain Service (Port 8001)
- **Technology**: FastAPI + LangChain
- **Features**:
  - Call Haystack for retrieval
  - Stream AI responses via OpenRouter
  - GPT-3.5-turbo integration
  - Chat history management

### Haystack Service (Port 8000)
- **Technology**: FastAPI + Haystack
- **Features**:
  - Document retrieval (hybrid search)
  - Query reformulation
  - Document ranking
  - MySQL to VectorDB indexing

### OpenSearch (Port 9200)
- **Technology**: OpenSearch
- **Features**:
  - Vector storage
  - Hybrid search (BM25 + Vector)
  - Document management

## 🚀 Deployment Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| React Frontend | 3000 | HTTP | User Interface |
| Spring Boot Gateway | 8080 | HTTP/WS | WebFlux Gateway |
| LangChain Service | 8001 | HTTP | AI Streaming |
| Haystack Service | 8000 | HTTP | RAG Retrieval |
| OpenSearch | 9200 | HTTP | Vector DB |

## 🔐 Security Considerations

1. **API Keys**: 
   - OpenRouter API key for LangChain
   - Store in environment variables

2. **CORS**:
   - Configured in Spring Boot for React origins
   - localhost:3000 and localhost:5173

3. **Rate Limiting**:
   - Can be added to Spring Boot Gateway
   - Prevent abuse

4. **Authentication**:
   - Add JWT/OAuth if needed
   - WebSocket authentication

## 📈 Scalability

### Horizontal Scaling
- **Spring Boot**: Multiple instances behind load balancer
- **Python Services**: Gunicorn workers
- **OpenSearch**: Cluster mode

### Vertical Scaling
- Increase JVM heap for Spring Boot
- More workers for Python services
- Larger OpenSearch nodes

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18+ |
| Gateway | Spring Boot WebFlux | 3.2.0 |
| AI Service | LangChain + FastAPI | Latest |
| RAG Service | Haystack + FastAPI | 2.0+ |
| Vector DB | OpenSearch | 2.11+ |
| Container | Docker + Docker Compose | Latest |
| Language | Java 17, Python 3.10+ | - |

## 🔄 Message Format

### WebSocket Message (Client → Server)
```json
{
  "question": "What is machine learning?",
  "chatHistory": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ],
  "filters": null
}
```

### Stream Event (Server → Client)
```json
// Metadata
{
  "type": "metadata",
  "reformulatedQuery": "machine learning definition",
  "docCount": 5
}

// Token
{
  "type": "token",
  "content": "Machine"
}

// Done
{
  "type": "done"
}

// Error
{
  "type": "error",
  "content": "Error message"
}
```

## 🧪 Testing

### Unit Tests
- Spring Boot: JUnit + WebFlux Test
- Python Services: pytest

### Integration Tests
- Test WebSocket connection
- Test SSE streaming
- Test end-to-end flow

### Load Tests
- Apache JMeter for load testing
- Test concurrent WebSocket connections
- Measure streaming performance

## 📝 Monitoring

### Logging
- Spring Boot: Logback
- Python: Standard logging
- Centralized: ELK Stack (optional)

### Metrics
- Spring Boot Actuator
- Custom metrics for streaming
- Response time tracking

### Health Checks
- `/health` endpoints on all services
- OpenSearch cluster health
- WebSocket connection status