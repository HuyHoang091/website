import { useState, useRef, useEffect, useCallback } from "react";
import { getStompClient, onStompConnect } from "../hooks/stompClient";

export default function useChatConnection(chatId) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const callbackRef = useRef(null); // Lưu trữ callback để dùng lại khi kết nối lại
  const pendingRef = useRef([]);

  // Kiểm tra kết nối định kỳ
  useEffect(() => {
    const t = setInterval(() => {
      if (!chatId) return;
      if (!clientRef.current || !clientRef.current.connected) {
        setConnected(false);
        clientRef.current = getStompClient();
      } else {
        try {
          clientRef.current.publish({ destination: "/app/ping", body: JSON.stringify({ ts: Date.now() }) });
          setConnected(true);
        } catch {
          setConnected(false);
          clientRef.current = getStompClient();
        }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [chatId]);

  // Đăng ký lắng nghe sự kiện WebSocket
  const subscribe = useCallback((callback) => {
    if (!chatId || !callback) return;
    
    // Lưu callback để dùng lại khi reconnect
    callbackRef.current = callback;
    
    // Hủy subscription cũ nếu có
    if (subRef.current) {
      try {
        subRef.current.unsubscribe();
      } catch (err) {
        console.error("Error unsubscribing:", err);
      }
      subRef.current = null;
    }

    // Chỉ subscribe khi client đã kết nối
    if (clientRef.current && clientRef.current.connected) {
      console.log("Subscribing to /user/queue/sale");
      subRef.current = clientRef.current.subscribe("/user/queue/sale", (m) => {
        try {
          const body = JSON.parse(m.body || "{}");
          callback(body);
        } catch (err) {
          console.error("ws msg parse err", err);
        }
      });
      setConnected(true);
    } else {
      console.log("Client not connected, will subscribe after connection");
    }
  }, [chatId]);

  // Khởi tạo kết nối
  useEffect(() => {
    if (!chatId) return;
    
    // Khởi tạo client
    const client = getStompClient();
    clientRef.current = client;

    const unsubscribe = onStompConnect((c) => {
      console.log("STOMP connected!");
      clientRef.current = c;
      setConnected(true);
      
      // Gửi lại các tin nhắn trong hàng đợi
      if (pendingRef.current.length) {
        console.log("Resending pending messages:", pendingRef.current.length);
        pendingRef.current.forEach((m) => {
          try {
            c.publish({ destination: "/app/saleMessage", body: JSON.stringify(m) });
            console.log("Resent message:", m);
          } catch (e) {
            console.error("Resend failed", e);
          }
        });
        pendingRef.current = [];
      }
      
      // Đăng ký lại subscription khi kết nối lại
      if (callbackRef.current) {
        console.log("Re-subscribing after connection");
        if (subRef.current) {
          try {
            subRef.current.unsubscribe();
          } catch (err) {
            console.error("Error unsubscribing before re-subscribe:", err);
          }
        }
        
        subRef.current = c.subscribe("/user/queue/sale", (m) => {
          try {
            const body = JSON.parse(m.body || "{}");
            callbackRef.current(body);
          } catch (err) {
            console.error("ws msg parse err", err);
          }
        });
      }
    });

    return () => {
      if (subRef.current) {
        try {
          subRef.current.unsubscribe();
        } catch (err) {
          console.error("Error unsubscribing on cleanup:", err);
        }
      }
      unsubscribe();
      setConnected(false);
    };
  }, [chatId]);

  // Gửi tin nhắn qua WebSocket
  const sendMessage = useCallback((msg) => {
    if (clientRef.current && clientRef.current.connected) {
      try {
        console.log("Sending message:", msg);
        clientRef.current.publish({ destination: "/app/saleMessage", body: JSON.stringify(msg) });
        return true;
      } catch (e) {
        console.error("Publish failed", e);
      }
    }
    
    console.log("Adding message to pending queue:", msg);
    pendingRef.current.push(msg);
    return false;
  }, []);

  return { 
    connected, 
    sendMessage, 
    subscribe,
    client: clientRef.current
  };
}