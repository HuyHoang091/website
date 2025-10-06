import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./ChatWindow.module.css";
import MessageItem from "./MessageItem";
import { v4 as uuidv4 } from "uuid";
import { getStompClient, onStompConnect } from "../../hooks/stompClient";

export default function ChatWindow({ chatId, chatName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [aiMode, setAiMode] = useState(false); // Thêm state cho AI mode

  const messagesRef = useRef(null);
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const pendingRef = useRef([]);
  const STREAM_ID = useRef(null); // id for AI streaming message

  useEffect(() => {
    if (!chatId) return;
    axios
      .get(`http://localhost:8080/api/chat/saler/${chatId}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") },
      })
      .then((res) => setMessages(res.data || []))
      .catch((e) => console.error(e));
  }, [chatId]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const sendToServer = (msg) => {
    if (clientRef.current && clientRef.current.connected) {
      try {
        clientRef.current.publish({ destination: "/app/saleMessage", body: JSON.stringify(msg) });
        return true;
      } catch (e) {
        console.error("publish failed", e);
      }
    }
    return false;
  };

  const enqueueAndSend = (msg) => {
    setMessages((p) => [...p, msg]);
    if (!sendToServer(msg)) pendingRef.current.push(msg);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
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
    setNewMessage("");
    enqueueAndSend(msg);
  };

  const uploadAndSend = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post("http://localhost:8080/api/upload/chat", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + localStorage.getItem("tokenJWT"),
        },
      });
      const msg = {
        clientId: uuidv4(),
        to: chatId,
        toName: chatName,
        type: "image",
        content: res.data.url,
        status: "SENDING",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSender: true,
      };
      enqueueAndSend(msg);
    } catch (e) {
      console.error("upload failed", e);
    }
  };

  const handleUploadImage = (e) => uploadAndSend(e.target.files?.[0]);

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type?.includes("image")) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          uploadAndSend(file);
        }
      }
    }
  };

  const subscribeMessages = (client) => {
    if (!chatId) return;
    if (subRef.current) subRef.current.unsubscribe?.();

    subRef.current = client.subscribe("/user/queue/sale", (m) => {
      try {
        const body = JSON.parse(m.body || "{}");

        // AI streaming token -> append to single streaming message (right side)
        if (body.partial && body.aiResponse && String(body.from) === String(chatId)) {
          const id = STREAM_ID.current || (STREAM_ID.current = `ai-stream-${chatId}`);
          setMessages((prev) => {
            const idx = prev.findIndex((x) => x.id === id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], content: (copy[idx].content || "") + (body.content || "") };
              return copy;
            }
            return [
              ...prev,
              {
                id,
                content: body.content || "",
                type: "message",
                time: new Date().toLocaleTimeString(),
                isSender: true, // show at right (sender)
                fromName: "AI Assistant",
                aiResponse: true,
                streaming: true,
              },
            ];
          });
          return;
        }

        // AI final message -> replace streaming with final
        if (body.aiResponse && !body.partial && String(body.from) === String(chatId)) {
          const streamId = STREAM_ID.current;
          STREAM_ID.current = null;
          setMessages((prev) => {
            const filtered = prev.filter((x) => x.id !== streamId);
            return [
              ...filtered,
              {
                id: body.id || `ai-${Date.now()}`,
                content: body.content || "",
                type: "message",
                time: body.createdAt || new Date().toLocaleTimeString(),
                isSender: true,
                fromName: "AI Assistant",
                aiResponse: true,
              },
            ];
          });
          return;
        }

        // status update for pending messages
        if (body.clientId) {
          setMessages((prev) => {
            const i = prev.findIndex((p) => p.clientId === body.clientId);
            if (i >= 0) {
              const copy = [...prev];
              copy[i] = { ...copy[i], ...body };
              return copy;
            }
            return prev;
          });
          return;
        }

        // normal user message (left side)
        if (body.from && !body.aiResponse) {
          if (String(body.from) === String(chatId)) {
            setMessages((p) => [
              ...p,
              {
                id: body.id,
                content: body.content,
                type: body.type || "message",
                time: body.createdAt,
                isSender: false,
                status: body.status,
              },
            ]);
          } else {
            window.dispatchEvent(new CustomEvent("chat:unread", { detail: { userId: body.from, message: body } }));
          }
          return;
        }
      } catch (err) {
        console.error("ws msg parse err", err);
      }
    });

    setConnected(true);
  };

  useEffect(() => {
    const t = setInterval(() => {
      if (!chatId) return;
      if (!clientRef.current || !clientRef.current.connected) {
        setConnected(false);
        clientRef.current = getStompClient();
      } else {
        try {
          clientRef.current.publish({ destination: "/app/ping", body: JSON.stringify({ ts: Date.now() }) });
        } catch {
          setConnected(false);
          clientRef.current = getStompClient();
        }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const client = getStompClient();
    clientRef.current = client;
    if (client && client.connected) subscribeMessages(client);

    const unsubscribe = onStompConnect((c) => {
      clientRef.current = c;
      subscribeMessages(c);
      if (pendingRef.current.length) {
        pendingRef.current.forEach((m) => {
          try {
            c.publish({ destination: "/app/saleMessage", body: JSON.stringify(m) });
          } catch (e) {
            console.error("resend failed", e);
          }
        });
        pendingRef.current = [];
      }
    });

    return () => {
      subRef.current?.unsubscribe?.();
      unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    // Lấy trạng thái AI khi mở chat với user mới
    axios
      .get(`http://localhost:8080/api/user-ai/${chatId}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") },
      })
      .then((res) => {
        if (res.data && typeof res.data.aiEnabled === "boolean") {
          setAiMode(res.data.aiEnabled);
        }
      })
      .catch((e) => console.error("Không lấy được trạng thái AI", e));
  }, [chatId]);

  const handleToggleAI = () => {
    const newAiMode = !aiMode;
    axios
      .put(`http://localhost:8080/api/user-ai/${chatId}?aiEnabled=${newAiMode}`, {}, {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") },
      })
      .then(() => setAiMode(newAiMode))
      .catch((e) => console.error("Không cập nhật được trạng thái AI", e));
  };

  // tính trạng thái input khi bật AI
  const inputDisabled = Boolean(aiMode);

  // khi AI bật, ngăn submit manual
  const handleSendMessageSafe = () => {
    if (inputDisabled) return;
    handleSendMessage();
  };

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
        <img src="http://localhost:8080/images/logo192.png" alt="avatar" className={styles.avatar} />
        <div className={styles.headerInfo}>
          <h2>{chatName}</h2>
          <div className={styles.connectionStatus}>
            {connected ? <span className={styles.connected}>● Đã kết nối</span> : <span className={styles.disconnected}>⚠️ Đang kết nối...</span>}
          </div>
          {/* Thêm UI Toggle AI */}
          <div className={styles.aiToggleContainer}>
            <span>Nhờ AI Chat</span>
            <label className={styles.switch}>
              <input type="checkbox" checked={aiMode} onChange={handleToggleAI} />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
            <span className={styles.aiStatus}>{aiMode ? '✓ Đang bật' : '✗ Tắt'}</span>
          </div>
        </div>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.map((msg) => (
          <MessageItem
            key={msg.id || msg.clientId || "msg-" + Math.random()}
            content={msg.content || ""}
            time={msg.time || msg.createdAt || ""}
            isSender={msg.isSender}
            status={msg.status || ""}
            type={msg.type || "message"}
            avatar="http://localhost:8080/images/logo192.png"
            fromName={msg.aiResponse ? "AI Assistant" : ""}
            aiResponse={msg.aiResponse}
            streaming={msg.streaming}
          />
        ))}
      </div>

      <div className={styles.inputBox}>
        <button className={styles.iconBtn} aria-disabled={inputDisabled} disabled={inputDisabled}>
          📎
          <input type="file" accept="image/*" className={styles.fileInput} onChange={handleUploadImage} disabled={inputDisabled} />
        </button>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder={aiMode ? "AI đang tạo phản hồi..." : "Nhập tin nhắn..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessageSafe()}
            onPaste={handlePaste}
            disabled={inputDisabled}
            className={inputDisabled ? styles.inputDisabled : ""}
          />
          {aiMode && (
            <div className={styles.generator} aria-hidden="true">
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          )}
        </div>

        <button className={styles.iconBtn} onClick={handleSendMessageSafe} aria-disabled={inputDisabled} disabled={inputDisabled}>
          {aiMode ? "🤖" : "📩"}
        </button>
      </div>
    </div>
  );
}