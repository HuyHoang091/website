import React, { useState, useEffect, useRef } from "react";
import styles from "./ChatWindow.module.css";
import MessageItem from "./MessageItem";
import AvatarGenerator from "../Common/AvatarGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowRestore, faWindowClose, faLightbulb } from "@fortawesome/free-solid-svg-icons";

// Custom hooks
import useChatConnection from "../../hooks/useChatConnection";
import useChatMessages from "../../hooks/useChatMessages";
import useAiMode from "../../hooks/useAiMode";
import useFileUpload from "../../hooks/useFileUpload";

const messageSuggestions = [
  {
    key: '/xinchao',
    label: 'Xin chào',
    template: 'Xin chào {{fullName}}, mình là tư vấn viên của Luxe Fashion. Mình có thể giúp gì cho bạn ạ?'
  },
  {
    key: '/camon',
    label: 'Cảm ơn',
    template: 'Cảm ơn {{fullName}} đã liên hệ với Luxe Fashion. Rất vui được hỗ trợ bạn!'
  },
  {
    key: '/sanpham',
    label: 'Giới thiệu sản phẩm',
    template: 'Luxe Fashion hiện đang có nhiều mẫu mới và chương trình khuyến mãi hấp dẫn. {{fullName}} có thể cho mình biết bạn đang quan tâm đến sản phẩm nào không ạ?'
  },
  {
    key: '/khuyenmai',
    label: 'Thông tin khuyến mãi',
    template: 'Hiện Luxe Fashion đang có chương trình giảm giá 20% cho tất cả các sản phẩm mới và freeship cho đơn hàng từ 500k. {{fullName}} có muốn tìm hiểu thêm không ạ?'
  },
  {
    key: '/size',
    label: 'Hướng dẫn chọn size',
    template: 'Để chọn size phù hợp, {{fullName}} có thể cho mình biết chiều cao và cân nặng của bạn được không? Mình sẽ tư vấn size phù hợp nhất ạ.'
  }
];

export default function ChatWindow({ chatId, chatName, onToggleCustomerInfo, showCustomerInfo, isLoaded, markAsLoaded }) {
  const [newMessage, setNewMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [suggestionInput, setSuggestionInput] = useState("");
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);
  
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

  useEffect(() => {
    if (!isInitialLoading && chatId && !isLoaded) {
      markAsLoaded(chatId);
    }
  }, [isInitialLoading, chatId, isLoaded, markAsLoaded]);

  // Xử lý click ra ngoài để đóng gợi ý
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý khi input thay đổi
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Kiểm tra xem có đang nhập lệnh / không
    if (value.startsWith('/')) {
      setSuggestionInput(value.slice(1).toLowerCase());
      const filtered = messageSuggestions.filter(
        suggestion => suggestion.key.slice(1).includes(value.slice(1).toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Xử lý khi nhấn phím
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showSuggestions && filteredSuggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[0]);
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === '/') {
      if (newMessage === '') {
        // Hiển thị tất cả gợi ý khi nhập / ở đầu
        setTimeout(() => {
          setSuggestionInput('');
          setFilteredSuggestions([...messageSuggestions]);
          setShowSuggestions(true);
        }, 50);
      }
    }
  };
  
  // Xử lý khi người dùng chọn một gợi ý
  const handleSelectSuggestion = (suggestion) => {
    // Thay thế {{fullName}} bằng tên người dùng
    const messageText = suggestion.template.replace('{{fullName}}', chatName);
    setNewMessage(messageText);
    setShowSuggestions(false);
    
    // Focus vào input và đặt con trỏ ở cuối
    if (inputRef.current) {
      inputRef.current.focus();
      const length = messageText.length;
      inputRef.current.setSelectionRange(length, length);
    }
  };

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
    <div className={styles.container}>
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

        {/* Icon cửa sổ để hiển thị thông tin khách hàng */}
        <div className={styles.customerInfoIcon} onClick={onToggleCustomerInfo}>
          <FontAwesomeIcon icon={showCustomerInfo ? faWindowClose : faWindowRestore} />
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
            ref={inputRef}
            type="text"
            placeholder={aiMode ? "AI đang tạo phản hồi..." : "Nhập / để xem gợi ý tin nhắn mẫu..."}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
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
          
          {/* Hiển thị gợi ý tin nhắn mẫu */}
          {showSuggestions && !aiMode && (
            <div className={styles.suggestionDropdown} ref={suggestionRef}>
              <div className={styles.suggestionHeader}>
                <FontAwesomeIcon icon={faLightbulb} /> Tin nhắn mẫu
              </div>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion) => (
                  <div 
                    key={suggestion.key} 
                    className={styles.suggestionItem}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className={styles.suggestionKey}>{suggestion.key}</div>
                    <div className={styles.suggestionLabel}>{suggestion.label}</div>
                  </div>
                ))
              ) : (
                <div className={styles.noSuggestions}>
                  Không tìm thấy mẫu tin nhắn phù hợp
                </div>
              )}
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