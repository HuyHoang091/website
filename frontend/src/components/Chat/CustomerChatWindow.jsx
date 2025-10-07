import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./ChatWindow.module.css";
import MessageItem from "./MessageItem";
import { v4 as uuidv4 } from 'uuid';
import { getStompClient, onStompConnect } from "../../hooks/stompClient";

export default function CustomerChatWindow({ userStr = localStorage.getItem("user") }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [connectionState, setConnectionState] = useState({
    connected: false,
    retryCount: 0,
    lastError: null
  });
  
  const [user, setUser] = useState({id: null});
  const messagesRef = useRef(null);
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const pendingMessagesRef = useRef([]);

  // Parse user from localStorage
  useEffect(() => {
    try {
      if (userStr) setUser(JSON.parse(userStr));
    } catch (err) {}
  }, [userStr]);

  // Load initial messages
  useEffect(() => {
    if (!user.id) return;
    axios.get(`http://localhost:8080/api/chat/${user.id}/saler`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") }
    })
    .then(res => setMessages(res.data))
    .catch(() => {})
  }, [user.id]);
  
  // Auto scroll on new messages
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Helper to send messages through WebSocket or queue if disconnected
  const sendMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
    
    if (clientRef.current?.active) {
      try {
        clientRef.current.publish({
          destination: "/app/userMessage",
          body: JSON.stringify(msg),
        });
      } catch {
        pendingMessagesRef.current.push(msg);
      }
    } else {
      pendingMessagesRef.current.push(msg);
    }
  };

  // Send text message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !user.id) return;
    
    const msg = {
      clientId: uuidv4(),
      from: user.id,
      fromName: user.fullName || user.username || "Khách",
      type: "message",
      content: newMessage,
      status: "SENDING",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSender: true,
      aiMode
    };
    
    setNewMessage("");
    sendMessage(msg);
  };

  // Process and upload file (image)
  const processFile = async (file) => {
    if (!file || !user.id) return;
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await axios.post("http://localhost:8080/api/upload/chat", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + localStorage.getItem("tokenJWT"),
        },
      });

      sendMessage({
        clientId: uuidv4(),
        from: user.id,
        fromName: user.fullName || "Khách",
        type: "image",
        content: res.data.url,
        status: "SENDING",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSender: true,
        aiMode
      });
    } catch {}
  };

  const handleUploadImage = e => processFile(e.target.files?.[0]);
  
  const handlePaste = e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          break;
        }
      }
    }
  };

  // WebSocket message handler
  const subscribeMessages = (client) => {
    if (!user.id) return;
    
    try { subRef.current?.unsubscribe(); } catch {}
    
    subRef.current = client.subscribe("/user/queue/user", (message) => {
      try {
        const body = JSON.parse(message.body);

        if (body.updatedMessageIds && body.status === "SEEN") {
          setMessages((prev) =>
            prev.map((msg) =>
              body.updatedMessageIds.includes(msg.id) && msg.isSender
                ? { ...msg, status: "SEEN" }
                : msg
            )
          );
          return;
        }
        
        // Handle AI streaming
        if (body.partial === true) {
          setMessages(prev => {
            const streamingIndex = prev.findIndex(msg => !msg.isSender && msg.streaming);
            if (streamingIndex >= 0) {
              // Update existing streaming message
              const updated = [...prev];
              updated[streamingIndex] = { 
                ...updated[streamingIndex], 
                content: updated[streamingIndex].content + (body.content || ""),
                lastUpdated: Date.now()
              };
              return updated;
            } else {
              // Create new streaming message
              return [...prev, {
                id: "ai-" + Date.now(),
                content: body.content || "",
                type: body.type || "text",
                time: new Date().toLocaleTimeString(),
                isSender: false,
                fromName: body.fromName || "AI",
                streaming: true,
                lastUpdated: Date.now()
              }];
            }
          });
        } 
        // Handle message status update
        else if (body.clientId) {
          setMessages(prev => {
            const index = prev.findIndex(msg => msg.clientId === body.clientId);
            if (index !== -1) {
              const newMessages = [...prev];
              newMessages[index] = { 
                ...newMessages[index], 
                id: body.id,
                status: body.status || newMessages[index].status 
              };
              return newMessages;
            }
            return prev;
          });
        }
        // Handle regular message or final AI response
        else {
          setMessages(prev => {
            // Filter out streaming messages if any
            const cleanMessages = body.status !== "ERROR" ? prev.filter(m => !m.streaming) : prev;
            
            return [...cleanMessages, {
              id: body.id || `msg-${Date.now()}`,
              content: body.content,
              type: body.type || "text",
              time: body.createdAt || new Date().toLocaleTimeString(),
              status: body.status,
              fromName: body.fromName || "AI",
              isSender: false,
              error: body.status === "ERROR"
            }];
          });
        }
      } catch {}
    });
    
    setConnectionState(prev => ({ ...prev, connected: true }));
  };

  // Connection monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user.id) return;
      
      if (!clientRef.current?.connected) {
        setConnectionState(prev => ({
          ...prev,
          connected: false,
          retryCount: prev.retryCount + 1
        }));
        clientRef.current = getStompClient();
      } else {
        try {
          clientRef.current.publish({
            destination: "/app/ping",
            body: JSON.stringify({ ts: Date.now() })
          });
          
          if (!connectionState.connected) {
            setConnectionState({ connected: true, retryCount: 0, lastError: null });
          }
        } catch {
          clientRef.current = getStompClient();
          setConnectionState(prev => ({
            ...prev,
            connected: false
          }));
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user.id, connectionState.connected]);

  // Initial connection and reconnect handling
  useEffect(() => {
    if (!user.id) return;

    clientRef.current = getStompClient();
    
    if (clientRef.current?.connected) {
      subscribeMessages(clientRef.current);
    }

    const unsubscribe = onStompConnect(client => {
      clientRef.current = client;
      subscribeMessages(client);

      // Send pending messages
      if (pendingMessagesRef.current.length > 0) {
        pendingMessagesRef.current.forEach(msg => {
          try {
            client.publish({
              destination: "/app/userMessage",
              body: JSON.stringify(msg),
            });
          } catch {}
        });
        pendingMessagesRef.current = [];
      }
    });

    return () => {
      try { subRef.current?.unsubscribe(); } catch {}
      unsubscribe();
    };
  }, [user.id]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src="http://localhost:8080/images/logo192.png" alt="avatar" className={styles.avatar} />
        <div className={styles.headerInfo}>
          <h2>Tư vấn viên</h2>
          <div className={styles.connectionStatus}>
            {connectionState.connected ? (
              <span className={styles.connected}>● Đã kết nối</span>
            ) : (
              <span className={styles.disconnected}>
                ⚠️ Đang kết nối{connectionState.retryCount > 0 ? ` (lần ${connectionState.retryCount})` : ''}...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.map((msg, index) => (
          <MessageItem
            key={msg.id || msg.clientId || `msg-${index}`}
            content={msg.content}
            time={msg.time || msg.createdAt}
            isSender={msg.isSender}
            status={msg.status}
            type={msg.type}
            avatar="http://localhost:8080/images/logo192.png"
            streaming={msg.streaming}
          />
        ))}
      </div>

      <div className={styles.inputBox}>
        <button className={styles.iconBtn}>
          📎
          <input type="file" accept="image/*" className={styles.fileInput} onChange={handleUploadImage} />
        </button>
        <input
          type="text"
          placeholder={aiMode ? "Hỏi AI trợ lý..." : "Nhắn tin cho tư vấn viên..."}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
          onPaste={handlePaste}
        />
        <button className={styles.sendBtn} onClick={handleSendMessage}>
          {aiMode ? '🤖' : '📩'}
        </button>
      </div>
    </div>
  );
}