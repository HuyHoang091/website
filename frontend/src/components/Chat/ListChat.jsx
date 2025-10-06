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
    const selectedChatIdRef = useRef(selectedChatId);

    useEffect(() => {
        axios.get("http://localhost:8080/api/chat/list", {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") }
        })
        .then(res => setChats(res.data))
        .catch(err => console.error("Error fetching chat list:", err));
    }, []);

    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

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
        
        // Lưu ref để có thể unsubscribe sau này
        subRef.current = {
            unsubscribe: () => {
                subscriptions.forEach(sub => sub.unsubscribe());
            }
        };
    }

    // Thêm hàm xử lý cập nhật chat list - tái sử dụng logic
    function updateChatList(body) {
        setChats((prevChats) => {
            const index = prevChats.findIndex(
                (chat) => String(chat.userId) === String(body.to)
            );

            if (index !== -1) {
                const updatedChat = {
                    ...prevChats[index],
                    lastMessage: body.content,
                    time: body.createdAt,
                    // Nếu user không phải là user hiện tại, tăng `unread`
                    unreadCount: selectedChatIdRef.current === body.to ? 0 : (prevChats[index].unreadCount || 0) + 1,
                };

                // Di chuyển chat được cập nhật lên đầu danh sách
                const newChats = [...prevChats];
                newChats.splice(index, 1);
                return [updatedChat, ...newChats];
            } else {
                // Nếu chat chưa có trong danh sách, thêm mới
                return [
                    {
                        userId: body.to,
                        name: `Khách ${body.to}`,
                        lastMessage: body.content,
                        time: body.createdAt,
                        unreadCount: selectedChatIdRef.current === body.to ? 0 : 1, // Nếu đang chọn, không tăng `unread`
                    },
                    ...prevChats,
                ];
            }
        });
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

    // Trong hàm `onSelectChat`, cập nhật trạng thái `unread` về 0
    function handleSelectChat(userId, userName) {
        if (String(selectedChatIdRef.current) === String(userId)) return;
        // Cập nhật trạng thái `unread` về 0 cho user được chọn
        setChats((prevChats) =>
            prevChats.map((chat) =>
                String(chat.userId) === String(userId)
                    ? { ...chat, unreadCount: 0 }
                    : chat
            )
        );

        // Gọi callback để mở cửa sổ chat
        if (onSelectChat) {
            onSelectChat(userId, userName);
        }
    }

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
                        unread={chat.unreadCount || 0}
                        onSelect={handleSelectChat}
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