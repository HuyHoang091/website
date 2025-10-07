import React, { useState, useEffect, useRef } from "react";
import styles from "./ChatWindow.module.css";
import MessageItem from "./MessageItem";
import AvatarGenerator from "../Common/AvatarGenerator";

// Custom hooks
import useChatConnection from "../../hooks/useChatConnection";
import useChatMessages from "../../hooks/useChatMessages";
import useAiMode from "../../hooks/useAiMode";
import useFileUpload from "../../hooks/useFileUpload";

export default function ChatWindow({ chatId, chatName }) {
  const [newMessage, setNewMessage] = useState("");
  // Create a unique key for each chat to ensure complete re-rendering
  const chatInstanceKey = useRef(`chat-${chatId}-${Date.now()}`);
  
  // Update the key when chatId changes
  useEffect(() => {
    chatInstanceKey.current = `chat-${chatId}-${Date.now()}`;
  }, [chatId]);

  // Kết nối WebSocket
  const { connected, sendMessage, subscribe } = useChatConnection(chatId);
  
  // Quản lý tin nhắn
  const { 
    displayMessages, 
    messagesRef, 
    createMessage, 
    addMessage, 
    handleNewMessage,
    isInitialLoading,
    hasMore,
    loadingMore,
    resetChatState
  } = useChatMessages(chatId, chatName);
  
  // Reset chat state when chatId changes
  useEffect(() => {
    if (resetChatState) {
      resetChatState();
    }
  }, [chatId, resetChatState]);
  
  // Chế độ AI
  const { aiMode, toggleAiMode } = useAiMode(chatId);
  
  // Upload file
  const { handlePaste, handleFileChange } = useFileUpload(createMessage, addMessage, sendMessage);

  // Đăng ký lắng nghe sự kiện WebSocket
  useEffect(() => {
    if (chatId) {
      subscribe(handleNewMessage);
    }
  }, [chatId, subscribe, handleNewMessage]);

  // Gửi tin nhắn
  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId || aiMode) return;
    
    const msg = createMessage(newMessage);
    setNewMessage("");
    addMessage(msg, sendMessage);
  };

  const uniqueDisplayMessages = Array.from(
    new Map(displayMessages.map(msg => [msg.id || msg.clientId, msg])).values()
  );

  // Nếu chưa chọn user chat
  if (!chatId) {
    return (
      <div>
        <div className={styles.logo}>✨ LUXE FASHION</div>
        <div className={styles.loadingBackground}>
          <div className={styles.floatingShapes}>
            <div className={`${styles.shape} ${styles.shape1}`}></div>
            <div className={`${styles.shape} ${styles.shape2}`}></div>
            <div className={`${styles.shape} ${styles.shape3}`}></div>
            <div className={`${styles.shape} ${styles.shape4}`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} key={chatInstanceKey.current}>
      <div className={styles.header}>
        <AvatarGenerator name={chatName} userId={chatId} size={50} />
        <div className={styles.headerInfo}>
          <h2>{chatName}</h2>
          <div className={styles.connectionStatus}>
            {connected ? 
              <span className={styles.connected}>● Đã kết nối</span> : 
              <span className={styles.disconnected}>⚠️ Đang kết nối...</span>}
          </div>
          <div className={styles.aiToggleContainer}>
            <span>Nhờ AI Chat</span>
            <label className={styles.switch}>
              <input type="checkbox" checked={aiMode} onChange={toggleAiMode} />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
            <span className={styles.aiStatus}>{aiMode ? '✓ Đang bật' : '✗ Tắt'}</span>
          </div>
        </div>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {/* Hiển thị loading skeleton khi đang tải tin nhắn ban đầu */}
        {isInitialLoading ? (
          <div className={styles.messagesSkeleton}>
            <div className={styles.skeletonMessage}>
              <div className={styles.skeletonAvatar}></div>
              <div className={styles.skeletonBubble}></div>
            </div>
            <div className={`${styles.skeletonMessage} ${styles.skeletonRight}`}>
              <div className={styles.skeletonBubble}></div>
              <div className={styles.skeletonAvatar}></div>
            </div>
            <div className={styles.skeletonMessage}>
              <div className={styles.skeletonAvatar}></div>
              <div className={styles.skeletonBubble}></div>
            </div>
            <div className={`${styles.skeletonMessage} ${styles.skeletonRight}`}>
              <div className={styles.skeletonBubble}></div>
              <div className={styles.skeletonAvatar}></div>
            </div>
          </div>
        ) : (
          <div className={styles.messagesContent} key={`messages-${chatId}`}>
            {/* Loading indicator always comes first at the top */}
            {hasMore && loadingMore && (
              <div className={styles.loadingMoreContainer}>
                <div className={styles.loadingMore}>
                  <div className={styles.loadingSpinner}></div>
                  <span>Đang tải tin nhắn cũ...</span>
                </div>
              </div>
            )}
            
            {/* Messages container as a separate section */}
            <div className={styles.messagesWrapper}>
              {uniqueDisplayMessages.map((msg) => (
                <MessageItem
                  key={msg.id ? `id-${msg.id}` : `temp-${msg.clientId}`}
                  content={msg.content || ""}
                  time={msg.time || msg.createdAt || ""}
                  isSender={msg.isSender}
                  status={msg.status || ""}
                  type={msg.type || "message"}
                  chatName={chatName}
                  chatId={chatId}
                  fromName={msg.aiResponse ? "AI Assistant" : ""}
                  aiResponse={msg.aiResponse}
                  streaming={msg.streaming}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputBox}>
        <button className={styles.iconBtn} aria-disabled={aiMode} disabled={aiMode}>
          📎
          <input 
            type="file" 
            accept="image/*" 
            className={styles.fileInput} 
            onChange={handleFileChange} 
            disabled={aiMode} 
          />
        </button>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder={aiMode ? "AI đang tạo phản hồi..." : "Nhập tin nhắn..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            onPaste={handlePaste}
            disabled={aiMode}
            className={aiMode ? styles.inputDisabled : ""}
          />
          {aiMode && (
            <div className={styles.generator} aria-hidden="true">
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          )}
        </div>

        <button 
          className={styles.iconBtn} 
          onClick={handleSendMessage} 
          aria-disabled={aiMode} 
          disabled={aiMode}
        >
          {aiMode ? "🤖" : "📩"}
        </button>
      </div>
    </div>
  );
}