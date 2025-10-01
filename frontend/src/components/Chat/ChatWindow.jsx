import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./ChatWindow.module.css";
import MessageItem from "./MessageItem";
import { v4 as uuidv4 } from 'uuid';
import { getStompClient, onStompConnect } from "../../hooks/stompClient";

export default function ChatWindow({ chatId, chatName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = useRef(null);
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const pendingMessagesRef = useRef([]);

  // load messages khi chọn chatId
  useEffect(() => {
    if (!chatId) return;

    axios.get(`http://localhost:8080/api/chat/saler/${chatId}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") }
    })
    .then(res => setMessages(res.data))
    .catch(err => console.error("Error fetching conversation:", err))
  }, [chatId]);

  // auto scroll khi thay đổi messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const msg = {
      clientId: uuidv4(),
      to: chatId,
      toName: chatName,
      type: "message",
      content: newMessage,
      status: "SENDING",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSender: true,
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");

    if (clientRef.current && clientRef.current.active) {
      try {
        clientRef.current.publish({
          destination: "/app/saleMessage",
          body: JSON.stringify(msg),
        });
      } catch (err) {
        console.error("❌ Gửi message thất bại:", err);
        pendingMessagesRef.current.push(msg);
      }
      
    } else {
      console.log("⚠️ STOMP client chưa kết nối, message sẽ được gửi sau");
      pendingMessagesRef.current.push(msg);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // gọi API upload ảnh
      const res = await axios.post("http://localhost:8080/api/upload/chat", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + localStorage.getItem("tokenJWT"),
        },
      });

      const imageUrl = res.data.url; // BE trả về link, ví dụ: http://localhost:8080/images/xxx.png

      // tạo message kiểu image
      const msg = {
        clientId: uuidv4(),
        to: chatId,
        toName: chatName,
        type: "image",
        content: imageUrl,
        status: "SENDING",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSender: true,
      };

      setMessages((prev) => [...prev, msg]);

      if (clientRef.current && clientRef.current.active) {
        try {
          clientRef.current.publish({
            destination: "/app/saleMessage",
            body: JSON.stringify(msg),
          });
        } catch (err) {
          console.error("❌ Gửi ảnh thất bại:", err);
          pendingMessagesRef.current.push(msg);
        }
      } else {
        console.log("⚠️ STOMP client chưa kết nối, image sẽ được gửi sau");
        pendingMessagesRef.current.push(msg);
      }
    } catch (err) {
      console.error("❌ Upload image failed:", err);
    }
  };

  // Xử lý paste: nếu dán ảnh thì upload và gửi message
  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const formData = new FormData();
          formData.append("file", file);
          try {
            const res = await axios.post("http://localhost:8080/api/upload/chat", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: "Bearer " + localStorage.getItem("tokenJWT"),
              },
            });
            const imageUrl = res.data.url;
            const msg = {
              clientId: uuidv4(),
              to: chatId,
              toName: chatName,
              type: "image",
              content: imageUrl,
              status: "SENDING",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isSender: true,
            };

            setMessages((prev) => [...prev, msg]);

            if (clientRef.current && clientRef.current.active) {
              try {
                clientRef.current.publish({
                  destination: "/app/saleMessage",
                  body: JSON.stringify(msg),
                });
              } catch (err) {
                console.error("❌ Gửi ảnh thất bại:", err);
                pendingMessagesRef.current.push(msg);
              }
            } else {
              console.log("⚠️ STOMP client chưa kết nối, image sẽ được gửi sau");
              pendingMessagesRef.current.push(msg);
            }
          } catch (err) {
            console.error("❌ Paste upload image failed:", err);
          }
        }
      }
    }
  };

  const subscribeMessages = (client) => {
    if (!chatId) return;
    if (subRef.current) subRef.current.unsubscribe();

    subRef.current = client.subscribe("/user/queue/sale", (message) => {
      const body = JSON.parse(message.body);

      setMessages((prev) => {
        const index = prev.findIndex((msg) => msg.clientId === body.clientId);
        if (index !== -1) {
          const newMessages = [...prev];
          newMessages[index] = { ...newMessages[index], ...body };
          return newMessages;
        }
        return [...prev, body];
      });
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!chatId) return;
      if (!clientRef.current || !clientRef.current.connected) {
        console.warn("⚠️ STOMP chưa kết nối, thử reconnect...");
        clientRef.current = getStompClient(); // ép tạo lại
      } else {
        try {
          clientRef.current.publish({
            destination: "/app/ping",
            body: JSON.stringify({ ts: Date.now() }),
          });
        } catch (err) {
          console.error("❌ Ping lỗi, reconnect lại...");
          clientRef.current = getStompClient();
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const client = getStompClient();
    clientRef.current = client;

    // subscribe ngay nếu client đã connect
    if (client && client.connected) {
      subscribeMessages(client);
    }

    // đăng ký để resubscribe khi reconnect
    const unsubscribeListener = onStompConnect((c) => {
    clientRef.current = c;
    subscribeMessages(c);

    // Gửi lại các tin nhắn pending
    if (pendingMessagesRef.current.length > 0) {
        pendingMessagesRef.current.forEach((m) => {
          try {
            c.publish({
              destination: "/app/saleMessage",
              body: JSON.stringify(m),
            });
          } catch (err) {
            console.error("❌ Gửi lại pending thất bại:", err);
          }
        });
        pendingMessagesRef.current = []; // clear queue
      }
    });

    return () => {
      if (subRef.current) subRef.current.unsubscribe();
      unsubscribeListener(); // hủy listener khi unmount
    };
  }, [chatId]);

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
        <img
          src="http://localhost:8080/images/logo192.png"
          alt="avatar"
          className={styles.avatar}
        />
        <span>
          <h2>{chatName}</h2>
          <p>Online</p>
        </span>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.map((msg) => (
          <MessageItem
            key={msg.id || msg.clientId}
            content={msg.content}
            time={msg.time}
            isSender={msg.isSender}
            status={msg.status}
            type={msg.type}
            avatar="http://localhost:8080/images/logo192.png"
          />
        ))}
      </div>

      <div className={styles.inputBox}>
        <button className={styles.iconBtn}>
          📎
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleUploadImage}
          />
        </button>
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          onPaste={handlePaste}  // <-- Thêm xử lý paste ở đây!
        />
        <button className={styles.iconBtn} onClick={handleSendMessage}>
          📩
        </button>
      </div>
    </div>
  );
}