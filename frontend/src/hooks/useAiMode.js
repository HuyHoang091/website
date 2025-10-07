import { useState, useEffect } from "react";
import axios from "axios";

export default function useAiMode(chatId) {
  const [aiMode, setAiMode] = useState(false);

  // Lấy trạng thái AI
  useEffect(() => {
    if (!chatId) return;
    
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

  // Bật/tắt chế độ AI
  const toggleAiMode = () => {
    const newAiMode = !aiMode;
    
    axios
      .put(`http://localhost:8080/api/user-ai/${chatId}?aiEnabled=${newAiMode}`, {}, {
        headers: { Authorization: "Bearer " + localStorage.getItem("tokenJWT") },
      })
      .then(() => setAiMode(newAiMode))
      .catch((e) => console.error("Không cập nhật được trạng thái AI", e));
  };

  return { aiMode, toggleAiMode };
}