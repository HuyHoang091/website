import React, { useState } from "react";
import ChatWindow from "../../components/Chat/ChatWindow";
import CustomerInfo from "../../components/Chat/CustomerInfo";
import ListChat from "../../components/Chat/ListChat";
import Menu from "../../components/Menu/Menu";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [loadedChats, setLoadedChats] = useState({});

  const handleSelectChat = (id, name) => { 
    setSelectedName(name);
    setSelectedChatId(id);
    setShowCustomerInfo(false); // Ẩn thông tin khách hàng khi chuyển sang chat mới
    console.log("Selected chat ID:", id);
  };

  const toggleCustomerInfo = () => {
    setShowCustomerInfo(prev => !prev);
  };

  // Đánh dấu chatId đã tải xong
  const markChatAsLoaded = (chatId) => {
    setLoadedChats((prev) => ({ ...prev, [chatId]: true }));
  };

  return (
    <div className={styles.chatPage}>
      <Menu />
      <div className={styles.chatContainer}>
        <div className={styles.sidebarContainer}>
          <ListChat onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
        </div>
        <div className={`${styles.mainContainer} ${showCustomerInfo ? styles.withSidebar : ''}`}>
          <div className={styles.chatWindowContainer}>
            <ChatWindow 
              key={selectedChatId}
              chatId={selectedChatId} 
              chatName={selectedName} 
              onToggleCustomerInfo={toggleCustomerInfo}
              showCustomerInfo={showCustomerInfo}
              isLoaded={loadedChats[selectedChatId]} // Truyền trạng thái đã tải xuống ChatWindow
              markAsLoaded={markChatAsLoaded}
            />
          </div>
          <div
            className={`
              ${styles.customerInfoContainer}
              ${showCustomerInfo && selectedChatId ? styles.show : ''}
            `}
          >
            {selectedChatId && (
              <CustomerInfo
                key={selectedChatId}
                userId={selectedChatId}
                userName={selectedName}
                isInline={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}