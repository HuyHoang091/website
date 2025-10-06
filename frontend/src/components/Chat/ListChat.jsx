import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./ListChat.module.css";
import CardChat from "./CardChat";
import { getStompClient, onStompConnect } from "../../hooks/stompClient";

export default function ListChat({ onSelectChat, selectedChatId }) {
    const [chats, setChats] = useState([]);
    const [search, setSearch] = useState("");
    const clientRef = useRef(null);
    const subRef = useRef(null);

    useEffect(() => {
        axios.get("http://localhost:8080/api/chat/list", {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") }
        })
        .then(res => setChats(res.data))
        .catch(err => console.error("Error fetching chat list:", err));
    }, []);

    const filteredChats = chats.filter((chat) => {
        const name = chat.name ? chat.name.toLowerCase() : "";
        const message = chat.message ? chat.message.toLowerCase() : "";
        const keyword = search.toLowerCase();

        return name.includes(keyword) || message.includes(keyword);
    });

    useEffect(() => {
        const interval = setInterval(() => {
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

    function subscribe(client) {
        if (subRef.current) subRef.current.unsubscribe();
        
        // Mảng chứa các subscription
        const subscriptions = [];

        // Subscribe kênh listchat
        subscriptions.push(client.subscribe("/user/queue/sale/listchat", (message) => {
            const body = JSON.parse(message.body);
            console.log("📩 Update list chat (listchat):", body);
            updateChatList(body);
        }));

        // Thêm: Subscribe kênh sale để bắt cập nhật tin nhắn user
        subscriptions.push(client.subscribe("/user/queue/sale", (message) => {
            try {
                const body = JSON.parse(message.body);
                
                // Bỏ qua các cập nhật status hoặc tin nhắn không có from (có thể là ping/pong)
                if (body.clientId || !body.from) return;
                
                console.log("📩 Update list chat (sale channel):", body);
                
                // Tạo object tương thích với định dạng listchat để sử dụng hàm updateChatList
                const listChatUpdate = {
                    to: body.from,
                    content: body.type === "image" 
                        ? (body.fromName || "") + ": Đã gửi 1 ảnh" 
                        : (body.fromName || "") + ": " + body.content,
                    createdAt: body.createdAt
                };
                
                updateChatList(listChatUpdate);
            } catch (err) {
                console.error("❌ Lỗi xử lý tin nhắn sale:", err);
            }
        }));
        
        // Lưu ref để có thể unsubscribe sau này
        subRef.current = {
            unsubscribe: () => {
                subscriptions.forEach(sub => sub.unsubscribe());
            }
        };
        
        // Lắng nghe sự kiện từ window (được phát từ ChatWindow)
        window.addEventListener("chat:unread", handleChatUnreadEvent);
        
        return () => {
            window.removeEventListener("chat:unread", handleChatUnreadEvent);
        };
    }

    // Thêm hàm xử lý cập nhật chat list - tái sử dụng logic
    function updateChatList(body) {
        // Cập nhật chat theo key = body.to
        setChats((prevChats) => {
            const index = prevChats.findIndex(
                (chat) => String(chat.id) === String(body.to) || String(chat.userId) === String(body.to)
            );
            
            if (index !== -1) {
                const updatedChat = {
                    ...prevChats[index],
                    lastMessage: body.content,
                    time: body.createdAt,
                    unread: selectedChatId === body.to ? 0 : (prevChats[index].unread || 0) + 1
                };
                
                // Di chuyển chat được cập nhật lên đầu danh sách
                const newChats = [...prevChats];
                newChats.splice(index, 1);
                return [updatedChat, ...newChats];
            } else {
                // Nếu chat chưa có trong list, thêm mới
                return [{
                    userId: body.to,
                    name: `Khách ${body.to}`, 
                    lastMessage: body.content,
                    time: body.createdAt,
                    unread: 1
                }, ...prevChats];
            }
        });
    }

    // Thêm hàm xử lý event từ ChatWindow
    function handleChatUnreadEvent(e) {
        const { userId, message } = e.detail;
        if (!userId) return;
        
        const listChatUpdate = {
            to: userId,
            content: message.type === "image" 
                ? (message.fromName || "") + ": Đã gửi 1 ảnh" 
                : (message.fromName || "") + ": " + message.content,
            createdAt: message.createdAt
        };
        
        updateChatList(listChatUpdate);
    }

    useEffect(() => {
        const client = getStompClient();
        clientRef.current = client;

        // subscribe ngay nếu client đã connect
        if (client && client.connected) {
            subscribe(client);
        }

        // đăng ký để resubscribe khi reconnect
        const unsubscribeListener = onStompConnect((c) => {
            clientRef.current = c;
            subscribe(c);
        });

        return () => {
            if (subRef.current) subRef.current.unsubscribe();
            unsubscribeListener(); // hủy listener khi unmount
        };
    }, []);

    return (
        <div className={styles.listChat} style={{width: "300px"}}>
            <div className={styles.header}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconChat}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <path d="M14.8 7.5a1.84 1.84 0 0 0-2.6 0l-.2.3-.3-.3a1.84 1.84 0 1 0-2.4 2.8L12 13l2.7-2.7c.9-.9.8-2.1.1-2.8z"></path>
                </svg>
                <span>ChatterBox</span>
            </div>
            <div className={styles.searchWrapper}>
                <input type="text" className={styles.search} placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}/>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M136 192C136 125.7 189.7 72 256 72C322.3 72 376 125.7 376 192C376 258.3 322.3 312 256 312C189.7 312 136 258.3 136 192zM48 546.3C48 447.8 127.8 368 226.3 368L285.7 368C384.2 368 464 447.8 464 546.3C464 562.7 450.7 576 434.3 576L77.7 576C61.3 576 48 562.7 48 546.3zM544 160C557.3 160 568 170.7 568 184L568 232L616 232C629.3 232 640 242.7 640 256C640 269.3 629.3 280 616 280L568 280L568 328C568 341.3 557.3 352 544 352C530.7 352 520 341.3 520 328L520 280L472 280C458.7 280 448 269.3 448 256C448 242.7 458.7 232 472 232L520 232L520 184C520 170.7 530.7 160 544 160z"/>
                </svg>
            </div>
            <div className={styles.chatList}>
                {filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                        <CardChat
                        key={chat.userId}
                        id={chat.userId}
                        name={chat.name}
                        message={chat.lastMessage}
                        time={chat.time}
                        avatar=""
                        onSelect={onSelectChat}
                        selectedId={selectedChatId}
                        />
                    ))
                ) : (
                    <div className={styles.noResult}>Không tìm thấy kết quả</div>
                )}
            </div>
        </div>
    );
}