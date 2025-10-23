"""
Haystack RAG Service - Document Retrieval & Ranking FastAPI Application
"""
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import local modules
from models.api import QueryRequest, RetrievalResponse, IndexRequest, IndexRequestJson, IndexResponse, DocumentsListResponse, ChunksListResponse, ChunkInfo, UpdateChunkRequest
from services.rag_service import HaystackRAGService
import redis
import json
from datetime import timedelta
from datetime import datetime
import uuid

# Kết nối Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="0917834505",   # Thêm mật khẩu ở đây
    decode_responses=False
)
# FastAPI app
app = FastAPI(title="Haystack RAG Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
rag_service = HaystackRAGService()

@app.post("/retrieve", response_model=RetrievalResponse)
async def retrieve_documents(request: QueryRequest):
    """Retrieve documents based on query"""
    return rag_service.retrieve_documents(
        query=request.question,
        filters=request.filters,
        top_k=request.top_k
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "haystack-rag"}

@app.post("/index/mysql", response_model=IndexResponse)
async def index_from_mysql(request: IndexRequest):
    """Index data from MySQL to Vector Database"""
    try:
        # Fetch data from MySQL
        json_rows = rag_service.fetch_mysql_data(config=request.mysql_config, query=request.query)
        
        if not json_rows:
            return IndexResponse(
                status="no_data",
                total_documents=0,
                indexed_documents=0,
                failed_documents=0,
                errors=["No data returned from MySQL query"]
            )
        
        # Process in batches
        total_docs = len(json_rows)
        indexed_total = 0
        failed_total = 0
        all_errors = []
        
        for i in range(0, total_docs, request.batch_size):
            batch = json_rows[i:i + request.batch_size]
            
            # Convert and index
            documents = rag_service.json_to_documents(
                json_rows=batch,
                content_field=request.content_field,
                metadata_fields=request.metadata_fields
            )
            
            result = rag_service.index_documents_to_vectordb(documents)
            
            indexed_total += result["indexed"]
            failed_total += result["failed"]
            all_errors.extend(result["errors"])
        
        return IndexResponse(
            status="completed" if failed_total == 0 else "partial",
            total_documents=total_docs,
            indexed_documents=indexed_total,
            failed_documents=failed_total,
            errors=all_errors
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

@app.post("/index/json", response_model=IndexResponse)
async def index_from_json(request: IndexRequestJson):
    try:
        if not request.json_data:
            return IndexResponse(
                status="no_data",
                total_documents=0,
                indexed_documents=0,
                failed_documents=0,
                errors=["No JSON data provided"],
                document_ids=[]
            )
        
        # Tạo document_id duy nhất
        document_id = request.document_info.document_id if request.document_info.document_id else str(uuid.uuid4())
        
        # Thêm thông tin tài liệu vào metadata của mỗi document
        for row in request.json_data:
            if not isinstance(row, dict):
                continue
            
            # Thêm thông tin tài liệu
            row["_document_id"] = document_id
            row["_document_name"] = request.document_info.name
            row["_source_type"] = request.document_info.source_type
            row["_description"] = request.document_info.description
            row["_indexed_at"] = datetime.now().isoformat()
            row["_tags"] = request.document_info.tags
            row["_enabled"] = True
        
        # Convert and index
        documents = rag_service.json_to_documents(
            json_rows=request.json_data,
            content_field=request.content_field,
            metadata_fields=request.metadata_fields + ["_document_id", "_document_name", 
                                                     "_source_type", "_description", 
                                                     "_indexed_at", "_tags", "_enabled"]
        )
        
        result = rag_service.index_documents_to_vectordb(documents)

        document_ids = [doc.id for doc in documents]
        
        return IndexResponse(
            status=result["status"],
            total_documents=len(request.json_data),
            indexed_documents=result["indexed"],
            failed_documents=result["failed"],
            errors=result["errors"],
            document_ids=document_ids,
            document_id=document_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/index/clear")
async def clear_index(document_ids: Optional[List[str]] = None):
    """Clear all documents or specific documents by IDs from the vector database"""
    try:
        if document_ids:
            # Xóa các document cụ thể theo ID
            rag_service.document_store.delete_documents(document_ids)
            return {"status": "success", "message": f"{len(document_ids)} documents deleted from index"}
        else:
            # Xóa tất cả documents
            all_docs = rag_service.document_store.filter_documents({})
            all_ids = [doc.id for doc in all_docs]

            if not all_ids:
                return {
                    "status": "success",
                    "message": "No documents to delete"
                }

            rag_service.document_store.delete_documents(document_ids=all_ids)

            return {
                "status": "success",
                "message": f"All {len(all_ids)} documents cleared from index"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/index/count")
async def get_document_count():
    """Get total number of documents in the vector database"""
    try:
        count = rag_service.document_store.count_documents()
        return {"total_documents": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents", response_model=DocumentsListResponse)
async def list_documents():
    """Lấy thông tin về tất cả các tài liệu"""
    try:
        all_documents = list(rag_service.document_store.filter_documents({}))
        
        # Nhóm documents theo document_id
        document_groups = {}
        
        for doc in all_documents:
            doc_id = doc.meta.get("_document_id")
            if not doc_id:
                continue
                
            if doc_id not in document_groups:
                document_groups[doc_id] = {
                    "document_id": doc_id,
                    "name": doc.meta.get("_document_name", "Unknown Document"),
                    "source_type": doc.meta.get("_source_type", "unknown"),
                    "description": doc.meta.get("_description", ""),
                    "chunk_count": 1,
                    "last_updated": doc.meta.get("_indexed_at", ""),
                    "tags": doc.meta.get("_tags", [])
                }
            else:
                document_groups[doc_id]["chunk_count"] += 1
                if doc.meta.get("_indexed_at", "") > document_groups[doc_id]["last_updated"]:
                    document_groups[doc_id]["last_updated"] = doc.meta.get("_indexed_at", "")
        
        return DocumentsListResponse(documents=list(document_groups.values()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/chunks", response_model=ChunksListResponse)
async def get_document_chunks(document_id: str):
    """Lấy tất cả các chunk thuộc về một tài liệu"""
    try:
        # Lọc documents theo document_id
        all_documents = list(rag_service.document_store.filter_documents({}))
        chunks = [doc for doc in all_documents if doc.meta.get("_document_id") == document_id]
        
        if not chunks:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Trích xuất thông tin tài liệu từ chunk đầu tiên
        first_chunk = chunks[0]
        document_info = {
            "document_id": document_id,
            "name": first_chunk.meta.get("_document_name", "Unknown Document"),
            "source_type": first_chunk.meta.get("_source_type", "unknown"),
            "description": first_chunk.meta.get("_description", ""),
            "chunk_count": len(chunks),
            "last_updated": max(c.meta.get("_indexed_at", "") for c in chunks),
            "tags": first_chunk.meta.get("_tags", [])
        }
        
        # Format chunks
        formatted_chunks = []
        for chunk in chunks:
            formatted_chunks.append({
                "id": chunk.id,
                "content": chunk.content,
                "metadata": {k: v for k, v in chunk.meta.items() if not k.startswith("_")},
                "enabled": chunk.meta.get("_enabled", True)
            })
        
        return ChunksListResponse(
            chunks=formatted_chunks,
            document_info=document_info
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/chunks/{chunk_id}", response_model=ChunkInfo)
async def update_chunk(chunk_id: str, request: UpdateChunkRequest):
    """Cập nhật nội dung và metadata của chunk"""
    try:
        # Tìm chunk cần cập nhật
        all_documents = list(rag_service.document_store.filter_documents({}))
        chunks = [doc for doc in all_documents if doc.id == chunk_id]
        
        if not chunks:
            raise HTTPException(status_code=404, detail=f"Chunk with ID {chunk_id} not found")
        
        chunk = chunks[0]
        
        # Cập nhật nội dung
        chunk.content = request.content
        
        # Cập nhật metadata (giữ nguyên metadata hệ thống)
        if request.metadata:
            # Giữ lại metadata hệ thống (bắt đầu bằng _)
            preserved_meta = {k: v for k, v in chunk.meta.items() if k.startswith("_")}
            
            # Cập nhật với metadata mới
            chunk.meta = {**request.metadata, **preserved_meta}
        
        # Cập nhật trạng thái enabled
        chunk.meta["_enabled"] = request.enabled
            
        # Cập nhật thời gian chỉnh sửa
        chunk.meta["_indexed_at"] = datetime.now().isoformat()
        
        # Tạo embedding mới
        embedding = rag_service.embedding_model.encode(request.content, convert_to_numpy=True)
        chunk.embedding = embedding.tolist()
        
        # # Lưu chunk đã cập nhật
        # rag_service.document_store.delete_documents([chunk.id])
        # rag_service.document_store.write_documents([chunk])
        
        return {
            "id": chunk.id,
            "content": chunk.content,
            "metadata": {k: v for k, v in chunk.meta.items() if not k.startswith("_")},
            "enabled": chunk.meta.get("_enabled", True)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chunks/{chunk_id}")
async def delete_chunk(chunk_id: str):
    """Xóa một chunk (chuyển sang lưu trữ tạm thời trong Redis)"""
    try:
        # Tìm chunk cần xóa
        all_documents = list(rag_service.document_store.filter_documents({}))
        chunks = [doc for doc in all_documents if doc.id == chunk_id]
        
        if not chunks:
            raise HTTPException(status_code=404, detail=f"Chunk with ID {chunk_id} not found")
        
        chunk = chunks[0]
        
        # Lưu chunk vào Redis trước khi xóa
        chunk_data = {
            "id": chunk.id,
            "content": chunk.content,
            "metadata": chunk.meta,
            "embedding": chunk.embedding if hasattr(chunk, "embedding") else None
        }
        
        # Chuyển thành JSON và lưu vào Redis
        redis_key = f"deleted_chunk:{chunk_id}"
        redis_client.setex(
            redis_key,
            timedelta(days=30),  # Giữ trong 30 ngày
            json.dumps(chunk_data)
        )
        
        # Xóa khỏi document store
        rag_service.document_store.delete_documents([chunk_id])
        
        return {"status": "success", "message": f"Chunk {chunk_id} deleted and stored in Redis"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Xóa tất cả các chunk thuộc về một tài liệu (chuyển sang lưu trữ tạm thời trong Redis)"""
    try:
        # Lọc documents theo document_id
        all_documents = list(rag_service.document_store.filter_documents({}))
        chunks = [doc for doc in all_documents if doc.meta.get("_document_id") == document_id]
        
        if not chunks:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Lưu từng chunk vào Redis trước khi xóa
        chunk_ids = []
        
        for chunk in chunks:
            chunk_ids.append(chunk.id)
            
            # Lưu chunk vào Redis
            chunk_data = {
                "id": chunk.id,
                "content": chunk.content,
                "metadata": chunk.meta,
                "embedding": chunk.embedding if hasattr(chunk, "embedding") else None
            }
            
            # Chuyển thành JSON và lưu vào Redis
            redis_key = f"deleted_chunk:{chunk.id}"
            redis_client.setex(
                redis_key,
                timedelta(days=30),  # Giữ trong 30 ngày
                json.dumps(chunk_data)
            )
        
        # Xóa tất cả chunk khỏi document store
        rag_service.document_store.delete_documents(chunk_ids)
        
        return {
            "status": "success", 
            "message": f"Document {document_id} deleted ({len(chunk_ids)} chunks)",
            "deleted_chunks": chunk_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   

@app.post("/chunks/{chunk_id}/restore")
async def restore_chunk(chunk_id: str):
    """Khôi phục chunk đã xóa từ Redis"""
    try:
        # Lấy dữ liệu chunk từ Redis
        redis_key = f"deleted_chunk:{chunk_id}"
        chunk_data_bytes = redis_client.get(redis_key)
        
        if not chunk_data_bytes:
            raise HTTPException(status_code=404, detail=f"Deleted chunk {chunk_id} not found in temporary storage")
        
        # Chuyển bytes thành string và parse JSON
        chunk_data_str = chunk_data_bytes.decode('utf-8')
        chunk_data = json.loads(chunk_data_str)
        
        # Tạo lại Document object
        from haystack import Document
        document = Document(
            id=chunk_data["id"],
            content=chunk_data["content"],
            meta=chunk_data["metadata"],
            embedding=chunk_data["embedding"] if chunk_data["embedding"] else None
        )
        
        # Thêm lại vào document store
        rag_service.document_store.write_documents([document])
        
        # Xóa khỏi Redis
        redis_client.delete(redis_key)
        
        return {"status": "success", "message": f"Chunk {chunk_id} restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_id}/restore")
async def restore_document(document_id: str):
    """Khôi phục tài liệu đã xóa từ Redis"""
    try:
        # Lấy danh sách tất cả key trong Redis bắt đầu bằng 'deleted_chunk:'
        keys_pattern = f"deleted_chunk:*"
        all_keys = []
        
        # Quét Redis để tìm tất cả key phù hợp
        cursor = 0
        while True:
            cursor, keys = redis_client.scan(cursor, match=keys_pattern)
            all_keys.extend(keys)
            if cursor == 0:
                break
        
        # Lọc và khôi phục các chunk thuộc về document_id
        restored_chunks = []
        
        for key in all_keys:
            try:
                # Lấy dữ liệu chunk
                chunk_data_bytes = redis_client.get(key)
                if not chunk_data_bytes:
                    continue
                    
                # Parse dữ liệu JSON
                chunk_data_str = chunk_data_bytes.decode('utf-8')
                chunk_data = json.loads(chunk_data_str)
                
                # Kiểm tra xem chunk có thuộc về document này không
                if chunk_data["metadata"].get("_document_id") == document_id:
                    # Tạo lại Document
                    from haystack import Document
                    document = Document(
                        id=chunk_data["id"],
                        content=chunk_data["content"],
                        meta=chunk_data["metadata"],
                        embedding=chunk_data["embedding"] if chunk_data["embedding"] else None
                    )
                    
                    # Thêm lại vào document store
                    rag_service.document_store.write_documents([document])
                    
                    # Xóa khỏi Redis
                    redis_client.delete(key)
                    
                    # Thêm vào danh sách đã khôi phục
                    restored_chunks.append(chunk_data["id"])
            except Exception:
                continue
        
        if not restored_chunks:
            raise HTTPException(status_code=404, detail=f"No chunks found for document ID {document_id} in temporary storage")
        
        return {
            "status": "success", 
            "message": f"Document {document_id} restored with {len(restored_chunks)} chunks",
            "restored_chunks": restored_chunks
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)