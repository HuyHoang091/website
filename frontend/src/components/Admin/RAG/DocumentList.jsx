import React, { useState } from 'react';

const API_URL = 'http://localhost:8002';

const DocumentList = ({ 
  documents, 
  systemDocumentId,
  onSelectDocument,
  onPushSystemData,
  onDeleteDocument,
  onRefreshDocuments,
  loading,
  styles
}) => {
  const [processingDocId, setProcessingDocId] = useState(null);
  const [togglingDocId, setTogglingDocId] = useState(null);
  
  // Thêm một document hệ thống mặc định nếu không có trong danh sách
  const allDocuments = systemDocumentId 
    ? documents 
    : [
        { 
          document_id: 'system_placeholder',
          name: 'System Data',
          source_type: 'system',
          description: 'System data for RAG processing',
          chunk_count: 0,
          last_updated: '',
          tags: ['system']
        },
        ...documents
      ];
      
  // Hàm để bật/tắt tất cả chunk của một document
  const handleToggleDocument = async (documentId, currentState) => {
    if (documentId === 'system_placeholder') return;
    
    setTogglingDocId(documentId);
    try {
      // Lấy tất cả chunk của document
      const response = await fetch(`${API_URL}/documents/${documentId}/chunks`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const chunks = data.chunks || [];
      
      // Thay đổi trạng thái enabled của tất cả chunk
      const newState = !currentState;
      
      // Cập nhật từng chunk
      const promises = chunks.map(chunk => 
        fetch(`${API_URL}/chunks/${chunk.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: chunk.content,
            metadata: chunk.metadata,
            enabled: newState
          })
        })
      );
      
      await Promise.all(promises);
      
      // Cập nhật lại danh sách document
      onRefreshDocuments();
      
    } catch (err) {
      console.error('Error toggling document:', err);
      alert(`Failed to toggle document: ${err.message}`);
    } finally {
      setTogglingDocId(null);
    }
  };
  
  // Hàm xử lý run/reload document
  const handleRunDocument = async (documentId) => {
    setProcessingDocId(documentId);
    
    try {
      if (documentId === 'system_placeholder') {
        await onPushSystemData();
      } else {
        // Lấy thông tin document hiện tại
        const document = documents.find(doc => doc.document_id === documentId);
        if (document) {
          // Gọi API với document ID hiện tại để ghi đè thay vì tạo mới
          await onPushSystemData(documentId, document.name); 
        }
      }
    } catch (error) {
      console.error('Error processing document:', error);
    } finally {
      setProcessingDocId(null);
    }
  };
  
  return (
    <div className={styles["document-list"]}>
      <div className={styles["document-list-header"]}>
        <h2>Available Documents</h2>
        <button 
          className={`${styles["btn"]} ${styles["reload-btn"]}`}
          onClick={onRefreshDocuments}
          disabled={loading}
        >
          <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`}></i> Refresh List
        </button>
      </div>
      <div className={styles["table-container"]}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Upload Date</th>
              <th>Enable</th>
              <th>Chunk Number</th>
              <th>Parse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allDocuments.map((document) => {
              const isProcessing = processingDocId === document.document_id;
              const isToggling = togglingDocId === document.document_id;
              const hasChunks = document.chunk_count > 0;
              const isSystemPlaceholder = document.document_id === 'system_placeholder';
              
              return (
                <tr 
                  key={document.document_id}
                  className={isSystemPlaceholder ? styles["system-row"] : ''}
                >
                  <td 
                    className={styles["document-name"]} 
                    onClick={() => !isSystemPlaceholder && onSelectDocument(document.document_id)}
                  >
                    {document.name}
                  </td>
                  <td>
                    {document.last_updated 
                      ? new Date(document.last_updated).toLocaleString() 
                      : 'Not indexed yet'}
                  </td>
                  <td>
                    {isSystemPlaceholder ? (
                      <span>-</span>
                    ) : (
                      <label className={styles["toggle-switch"]}>
                        <input 
                          type="checkbox" 
                          checked={document.enabled !== false}
                          disabled={isToggling || !hasChunks}
                          onChange={() => handleToggleDocument(document.document_id, document.enabled !== false)}
                        />
                        <span className={styles["toggle-slider"]}></span>
                      </label>
                    )}
                  </td>
                  <td>{document.chunk_count || 0}</td>
                  <td>{hasChunks ? 'Parsed' : 'Not Parsed'}</td>
                  <td className={styles["actions-cell"]}>
                    {/* Run/Reload button */}
                    <button 
                      className={`${styles["btn"]} ${styles["icon-btn"]} ${hasChunks ? styles["reload-btn"] : styles["run-btn"]}`}
                      onClick={() => handleRunDocument(document.document_id)}
                      disabled={isProcessing || loading}
                      title={hasChunks ? 'Reload Document' : 'Run Processing'}
                    >
                      {isProcessing ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : hasChunks ? (
                        <i className="fas fa-sync-alt"></i>
                      ) : (
                        <i className="fas fa-play"></i>
                      )}
                    </button>
                    
                    {/* View button */}
                    {/* {!isSystemPlaceholder && hasChunks && (
                      <button 
                        className={`${styles["btn"]} ${styles["icon-btn"]} ${styles["view-btn"]}`}
                        onClick={() => onSelectDocument(document.document_id)}
                        title="View Chunks"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    )} */}
                    
                    {/* Delete button */}
                    {!isSystemPlaceholder && (
                      <button 
                        className={`${styles["btn"]} ${styles["icon-btn"]} ${styles["delete-btn"]}`}
                        onClick={() => onDeleteDocument(document.document_id)}
                        disabled={loading}
                        title="Delete Document"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;