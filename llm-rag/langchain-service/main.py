"""
LangChain Streaming Service - AI Response with OpenRouter
"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import json
import os
from pathlib import Path
from dotenv import load_dotenv

_here = Path(__file__).resolve().parent
_env_path = _here / ".env"
if not _env_path.exists():
    _env_path = _here.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    pass
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.callbacks.base import BaseCallbackHandler

app = FastAPI(title="LangChain Streaming Service")

# Configuration
HAYSTACK_SERVICE_URL = os.getenv("HAYSTACK_SERVICE_URL", "http://localhost:8002")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Request Models
class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[Dict[str, str]]] = []
    filters: Optional[Dict[str, Any]] = None
    stream: bool = True

# Custom Streaming Handler
class StreamingCallbackHandler(BaseCallbackHandler):
    def __init__(self):
        self.tokens = []
    
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.tokens.append(token)

class LangChainStreamingService:
    def __init__(self):
        self.llm = self.setup_llm()
        self.httpx_client = httpx.AsyncClient(timeout=30.0)
    
    def setup_llm(self):
        """Setup LangChain LLM with OpenRouter"""
        return ChatOpenAI(
            model="openai/gpt-3.5-turbo",
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base=OPENROUTER_BASE_URL,
            streaming=True,
            temperature=0,
            max_tokens=650
        )
    
    async def retrieve_from_haystack(self, question: str, filters: Optional[Dict] = None):
        """Call Haystack service to retrieve documents"""
        try:
            # Đảm bảo filters đúng định dạng - chuyển đổi nếu cần
            sanitized_filters = self._sanitize_filters(filters)
            
            # Gửi request đến Haystack service
            response = await self.httpx_client.post(
                f"{HAYSTACK_SERVICE_URL}/retrieve",
                json={
                    "question": question,
                    "filters": sanitized_filters,
                    "top_k": 20
                },
                timeout=30.0  # Explicit timeout
            )
            response.raise_for_status()
            result = response.json()
            
            # Kiểm tra kết quả
            if not result.get("documents"):
                print(f"Warning: No documents returned for query: {question}")
            
            return result
        except httpx.HTTPStatusError as e:
            print(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, 
                               detail=f"Haystack service error: {e.response.text}")
        except httpx.RequestError as e:
            print(f"Request error: {str(e)}")
            raise HTTPException(status_code=503, 
                               detail=f"Haystack service unavailable: {str(e)}")
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            raise HTTPException(status_code=500, 
                               detail=f"Haystack integration error: {str(e)}")
    
    def _sanitize_filters(self, filters: Optional[Dict]) -> Optional[Dict]:
        """Đảm bảo filters có định dạng đúng cho Haystack"""
        if not filters:
            return None
            
        # Chuyển đổi filters nếu cần
        sanitized = {}
        for key, value in filters.items():
            if isinstance(value, dict):
                # Đã là định dạng phức tạp (operator)
                sanitized[key] = value
            else:
                # Chuyển sang định dạng $eq operator
                sanitized[key] = {"$eq": value}
                
        return sanitized
    
    async def generate_response_stream(self, prompt: str, documents: List[Dict]):
        """Generate streaming response using LangChain"""
        # Prepare context from documents
        context = self._format_documents(documents)
        
        # Create messages
        messages = [
            SystemMessage(content="""Bạn là nhân viên tư vấn bán quần áo chuyên nghiệp tại shop thời trang.
            Hãy trả lời khách hàng bằng tiếng Việt một cách lịch sự, thân thiện và đúng chuyên môn.
            PHẢI trả lời dựa HOÀN TOÀN vào thông tin được cung cấp từ các tài liệu.
            Sử dụng số tham chiếu [SỐ] khi đề cập đến thông tin cụ thể từ tài liệu.
            Nếu tài liệu không có đủ thông tin, hãy thành thật rằng bạn không có thông tin đó.
            Đưa ra các gợi ý phù hợp về kích cỡ, màu sắc hoặc các sản phẩm tương tự nếu thông tin có trong tài liệu.
            Luôn tích cực và giúp khách hàng tìm được sản phẩm phù hợp nhất với nhu cầu."""),
            HumanMessage(content=f"{context}\n\nCâu hỏi của khách hàng: {prompt}")
        ]
        
        # Stream response
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield f"data: {json.dumps({'content': chunk.content, 'type': 'token'})}\n\n"
        
        # Send done signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    def _format_documents(self, documents: List[Dict]) -> str:
        """Format documents for context - phù hợp với cấu trúc Haystack"""
        if not documents:
            return "Không tìm thấy thông tin sản phẩm liên quan."
        
        formatted = "Đây là thông tin sản phẩm:\n\n"
        for idx, doc in enumerate(documents, 1):
            # Lấy thông tin metadata phổ biến
            meta = {}
            if 'meta' in doc:
                meta = doc['meta']
            elif isinstance(doc.get('score'), (int, float)):
                # Đây là định dạng Haystack của chúng ta
                meta = {k: v for k, v in doc.items() 
                      if k not in ('id', 'content', 'score')}
            
            # Tạo phần mô tả metadata
            meta_desc = []
            for key, value in meta.items():
                if key == 'sku':
                    meta_desc.append(f"Mã SP: {value}")
                elif key == 'size':
                    meta_desc.append(f"Kích cỡ: {value}")
                elif key == 'color':
                    meta_desc.append(f"Màu sắc: {value}")
                elif key == 'price':
                    try:
                        price_num = float(value)
                        formatted_price = f"{price_num:,.0f}đ"
                    except:
                        formatted_price = value
                    meta_desc.append(f"Giá: {formatted_price}")
                elif key == 'stock':
                    meta_desc.append(f"Tồn kho: {value}")
            
            meta_text = ", ".join(meta_desc) if meta_desc else "Không có thông tin chi tiết"
            content = doc.get('content', '')
            
            formatted += f"Sản phẩm [{idx}]:\n"
            formatted += f"{meta_text}\n"
            formatted += f"Chi tiết: {content}\n\n"
        
        return formatted

# Initialize service
streaming_service = LangChainStreamingService()

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint with streaming support
    1. Retrieves documents from Haystack service
    2. Generates streaming response using LangChain
    """
    try:
        full_question = ""
        for turn in request.chat_history:
            role = turn["role"]
            content = turn["content"]
            full_question += f"{role}: {content}\n"
        full_question += f"user: {request.question}"
        # Step 1: Retrieve documents from Haystack
        haystack_result = await streaming_service.retrieve_from_haystack(
            question=full_question,
            filters=request.filters
        )
        
        reformulated_query = haystack_result["reformulated_query"]
        documents = haystack_result["documents"]
        
        # Log để debug
        print(f"Reformulated query: {reformulated_query}")
        print(f"Retrieved {len(documents)} documents")
        
        # Step 2: Stream response
        if request.stream:
            # Send metadata first
            async def generate():
                # Send metadata
                yield f"data: {json.dumps({'type': 'metadata', 'reformulated_query': reformulated_query, 'doc_count': len(documents)})}\n\n"
                
                # Stream AI response - sử dụng reformulated_query thay vì question gốc
                async for chunk in streaming_service.generate_response_stream(reformulated_query, documents):
                    yield chunk
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",  # CORS support
                }
            )
        else:
            # Non-streaming response
            full_response = ""
            async for chunk in streaming_service.generate_response_stream(reformulated_query, documents):
                if '"type": "token"' in chunk:
                    data = json.loads(chunk.replace("data: ", ""))
                    full_response += data.get("content", "")
            
            return {
                "reformulated_query": reformulated_query,
                "answer": full_response,
                "documents": documents
            }
    
    except Exception as e:
        import traceback
        print(f"Error in /chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/simple")
async def chat_simple(question: str):
    """
    Simplified chat endpoint - streaming only
    """
    request = ChatRequest(question=question, stream=True)
    return await chat(request)

@app.get("/health")
async def health_check():
    """Kiểm tra cả haystack service"""
    try:
        # Kiểm tra haystack service
        response = await streaming_service.httpx_client.get(f"{HAYSTACK_SERVICE_URL}/health")
        haystack_status = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        haystack_status = "unavailable"
        
    return {
        "status": "healthy", 
        "service": "langchain-streaming",
        "haystack": haystack_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)